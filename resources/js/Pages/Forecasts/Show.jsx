// Show.jsx
import { useState, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, LoaderCircle, Eye, Star, TrendingUp, BarChart, Shield } from "lucide-react";
import { ethers } from "ethers";

// ABIs
import FutureCastABI from "@/abi/FutureCast.json";
import ERC20ABI from "@/abi/ERC20.json";

// Read addresses from .env (Vite)
const dagTokenAddress = import.meta.env.VITE_DAG_TOKEN_ADDRESS;
const futureCastAddress = import.meta.env.VITE_FUTURECAST_ADDRESS;

function StakeButton({ onStake, amount, isLoading, feedback }) {
  const thisButtonIsLoading = isLoading && feedback.includes(String(amount));
  return (
    <button
      onClick={() => onStake(amount)}
      disabled={isLoading}
      className="w-full bg-yellow-400 text-slate-900 font-bold py-3 rounded-lg hover:bg-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {thisButtonIsLoading ? feedback : "Stake Now"}
    </button>
  );
}

function BlockDagLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 0L100 25V75L50 100L0 75V25L50 0Z" fill="url(#paint0_linear_101_2)" />
      <defs>
        <linearGradient id="paint0_linear_101_2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00F2FF" /><stop offset="1" stopColor="#8727FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Show({ forecast, auth, userStakeLevel = 0 }) {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [unlockedContent, setUnlockedContent] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // quick visibility for debugging env values
  console.log("ENV addresses:", { dagTokenAddress, futureCastAddress });

  useEffect(() => {
    // Check if user has already unlocked this forecast
    if (userStakeLevel >= 50) {
      setIsUnlocked(true);
      if (forecast?.unlockedContent) {
        setUnlockedContent(typeof forecast.unlockedContent === 'string' 
          ? JSON.parse(forecast.unlockedContent) 
          : forecast.unlockedContent);
      }
    }
  }, [forecast, userStakeLevel]);

  if (!forecast) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1E203B] to-slate-900 text-white font-sans p-4 flex flex-col items-center justify-center text-center">
        <Head title="Loading Forecast..." />
        <LoaderCircle className="w-12 h-12 animate-spin mb-4" />
        <h1 className="text-3xl font-bold">Forecast Not Found</h1>
        <p className="text-slate-400 mt-2">The forecast you are looking for does not exist in the database.</p>
        <Link href={route("dashboard")} className="mt-6 bg-yellow-400 text-slate-900 font-bold py-2 px-4 rounded-lg">
          &larr; Go Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleStake = async (amount) => {
    // basic checks
    if (!window.ethereum) {
      alert("Please install MetaMask.");
      return;
    }
    if (!ethers.isAddress(dagTokenAddress) || !ethers.isAddress(futureCastAddress)) {
      console.error("Invalid contract address:", { dagTokenAddress, futureCastAddress });
      alert("Invalid contract configuration. Please check your .env values.");
      return;
    }

    setIsLoading(true);
    setFeedback(`Preparing to stake ${amount}...`);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const me = await signer.getAddress();
      console.log("Account:", me);

      const futureCastContract = new ethers.Contract(futureCastAddress, FutureCastABI, signer);
      const tokenContract = new ethers.Contract(dagTokenAddress, ERC20ABI, signer);

      // use forecast.id from props
      const onChainForecastId = Number(forecast?.id ?? forecast?.onchain_id ?? NaN);
      if (!Number.isFinite(onChainForecastId) || isNaN(onChainForecastId)) {
        console.warn("Invalid forecast id provided by props, aborting:", forecast);
        alert("Invalid forecast id (frontend). Contact admin.");
        setIsLoading(false);
        setFeedback("");
        return;
      }

      // Try to read forecast existence (best-effort)
      try {
        if (futureCastContract.forecasts) {
          const onchain = await futureCastContract.forecasts(onChainForecastId);
          console.log("onchain forecast struct:", onchain);
          // optional heuristic: if the struct is empty, abort
          // (adjust based on your contract's struct fields)
          if (onchain && onchain.length !== undefined) {
            // If first element is 0 and other fields empty, it might be missing — we'll still let attempt proceed but warn
            if (onchain.length > 0 && (onchain[0] === 0 || (onchain.title !== undefined && onchain.title === ""))) {
              console.warn("Forecast struct returned but may be empty:", onchain);
            }
          }
        } else if (futureCastContract.getForecast) {
          const onchain = await futureCastContract.getForecast(onChainForecastId);
          console.log("onchain forecast (getForecast):", onchain);
        } else {
          console.log("No forecast read method in ABI; continuing.");
        }
      } catch (readErr) {
        console.warn("Forecast read failed — likely does not exist:", readErr);
        alert("Forecast ID does not exist on-chain for this contract. Aborting.");
        setIsLoading(false);
        setFeedback("");
        return;
      }

      // prepare amount in wei; get token decimals for ERC20 path
      let decimals = 18;
      let tokenLooksOK = true;
      try {
        const dec = await tokenContract.decimals();
        decimals = Number(dec);
        const sym = await tokenContract.symbol();
        console.log("ERC20 token metadata:", { symbol: sym, decimals });
      } catch (metaErr) {
        console.warn("Token metadata call failed. Token may not be standard ERC20 or ABI mismatch:", metaErr);
        tokenLooksOK = false;
        // still continue; we will detect and fallback as needed
      }
      const stakeAmountInWei = ethers.parseUnits(String(amount), decimals);

      // FIRST ATTEMPT: try calling stakeAndUnlock with value (native BDAG)
      // This is the "no-approve" path you used before.
      try {
        setFeedback("Confirm in wallet (native payment)...");
        console.log("Attempt native stakeAndUnlock:", { onChainForecastId, amount: stakeAmountInWei.toString() });
        const tx = await futureCastContract.stakeAndUnlock(onChainForecastId, amount === 50 ? 0 : 1, { value: stakeAmountInWei });
        console.log("Native stake tx hash:", tx.hash);
        setFeedback("Confirming native tx...");
        await tx.wait();
        setFeedback("Success! Forecast unlocked (native).");
        setIsUnlocked(true);
        if (forecast?.unlockedContent) {
          setUnlockedContent(typeof forecast.unlockedContent === 'string' 
            ? JSON.parse(forecast.unlockedContent) 
            : forecast.unlockedContent);
        }
        alert("🎉 Success — forecast unlocked (native payment).");
        setIsLoading(false);
        return;
      } catch (nativeErr) {
        // If native path fails, inspect reason
        console.warn("Native stake path failed (falling back to ERC20 approve+stake):", nativeErr);
        // If error is "Forecast does not exist", abort early
        const nativeReason = nativeErr?.reason || nativeErr?.message || "";
        if (/(Forecast does not exist|does not exist)/i.test(nativeReason)) {
          alert(`Staking aborted: ${nativeReason}`);
          setIsLoading(false);
          setFeedback("");
          return;
        }
        // If it's explicitly a non-payable or missing value problem, we continue to ERC20 path.
      }

      // SECOND ATTEMPT: ERC20 approve -> stake (no value)
      // Check ERC20 balance first
      if (!tokenLooksOK) {
        // If token metadata failed, warn user
        alert("Token contract looks non-standard; ERC20 approve flow may fail. Check token address/ABI.");
      }

      const rawBalance = await tokenContract.balanceOf(me);
      console.log("Token balance raw:", rawBalance.toString());
      if (BigInt(rawBalance) < BigInt(stakeAmountInWei)) {
        alert("Insufficient token balance for staking. Please acquire tokens and try again.");
        setIsLoading(false);
        setFeedback("");
        return;
      }

      // Approve
      setFeedback("1/2: Approving token transfer...");
      console.log("Calling approve:", { spender: futureCastAddress, amount: stakeAmountInWei.toString() });
      const approveTx = await tokenContract.approve(futureCastAddress, stakeAmountInWei);
      console.log("Approve tx hash:", approveTx.hash);
      await approveTx.wait();
      console.log("Approve mined");

      // Stake (ERC20 path: no value)
      setFeedback("2/2: Staking via contract (ERC20)...");
      const tierIdx = amount === 50 ? 0 : 1;
      const stakeTx = await futureCastContract.stakeAndUnlock(onChainForecastId, tierIdx);
      console.log("ERC20 stake tx hash:", stakeTx.hash);
      await stakeTx.wait();

      setFeedback("Success! Forecast unlocked (ERC20).");
      setIsUnlocked(true);
      if (forecast?.unlockedContent) {
        setUnlockedContent(typeof forecast.unlockedContent === 'string' 
          ? JSON.parse(forecast.unlockedContent) 
          : forecast.unlockedContent);
      }
      alert("🎉 Success — forecast unlocked (ERC20).");
    } catch (err) {
      console.error("Staking failed at top-level:", err);
      const reason = err?.reason || err?.message || JSON.stringify(err);
      alert(`Transaction failed: ${reason}`);
      setFeedback("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head title={`Unlock ${forecast.title}`} />
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1E203B] to-slate-900 text-white font-sans p-4 flex justify-center">
        <div className="w-full max-w-md h-full flex flex-col">
          <header className="flex items-center gap-4 mb-8">
            <Link href={route("dashboard")} className="p-2 rounded-full hover:bg-white/10">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-3xl font-bold">Unlock Advanced Prediction</h1>
          </header>

          <main className="flex-grow flex flex-col gap-6">
            {/* Forecast Preview */}
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 border border-slate-600 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold">{forecast.title}</h2>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400">Country: {forecast.country}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-slate-300">{isUnlocked ? 'Unlocked' : 'Locked'}</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-400 mb-4">
                {forecast.freeSummary}
              </div>
              
              {/* Unlocked Content */}
              {isUnlocked && unlockedContent && (
                <div className="mt-6 space-y-4">
                  <div className="border-t border-slate-600 pt-4">
                    <h3 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Premium Analysis Unlocked
                    </h3>
                    <p className="text-slate-300 mb-4">{unlockedContent.detail}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800/30 rounded-lg p-3">
                        <div className="text-yellow-400 font-bold text-2xl">{unlockedContent.confidence}%</div>
                        <div className="text-slate-400 text-sm">Confidence Score</div>
                      </div>
                      <div className="bg-slate-800/30 rounded-lg p-3">
                        <div className="text-green-400 font-bold text-lg">AI Generated</div>
                        <div className="text-slate-400 text-sm">Analysis Method</div>
                      </div>
                    </div>
                    
                    {unlockedContent.key_drivers && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2 text-slate-200">Key Economic Drivers:</h4>
                        <ul className="list-disc list-inside text-slate-300 space-y-1">
                          {unlockedContent.key_drivers.map((driver, index) => (
                            <li key={index} className="text-sm">{driver}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Show staking options only if not unlocked */}
            {!isUnlocked && (
              <>
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Eye className="w-4 h-4" />
                    <span>Preview Mode - Limited Information</span>
                  </div>
                  <p className="text-slate-300">Stake DAG tokens to unlock AI-powered analysis, confidence scores, and detailed forecasts</p>
                </div>

                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                  <h3 className="text-yellow-400 font-semibold mb-2">What You'll Unlock:</h3>
                  <ul className="text-slate-300 text-sm space-y-1">
                    <li className="flex items-center gap-2"><TrendingUp className="w-3 h-3" /> Historical trend analysis</li>
                    <li className="flex items-center gap-2"><Star className="w-3 h-3" /> AI confidence scoring</li>
                    <li className="flex items-center gap-2"><BarChart className="w-3 h-3" /> Detailed economic drivers</li>
                    <li className="flex items-center gap-2"><Shield className="w-3 h-3" /> Full methodology breakdown</li>
                  </ul>
                </div>
              </>
            )}

            {/* Staking Options */}
            {!isUnlocked && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center flex flex-col gap-3">
                  <h3 className="font-bold text-yellow-400">Stake 50 tokens</h3>
                  <p className="text-sm font-semibold">Basic Unlock</p>
                  <p className="text-xs text-slate-400 flex-grow">AI Analysis & Confidence Scores</p>
                  <StakeButton onStake={handleStake} amount={50} isLoading={isLoading} feedback={feedback} />
                </div>
                <div className="text-center flex flex-col gap-3">
                  <h3 className="font-bold text-yellow-400">Stake 100 tokens</h3>
                  <p className="text-sm font-semibold">Full Unlock</p>
                  <p className="text-xs text-slate-400">Complete Analysis & Trends</p>
                  <p className="text-xs text-slate-400 flex-grow">Premium Member Access</p>
                  <StakeButton onStake={handleStake} amount={100} isLoading={isLoading} feedback={feedback} />
                </div>
              </div>
            )}
            
            {/* Premium Access Link */}
            {isUnlocked && (
              <div className="text-center">
                <Link 
                  href={route('premium')} 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-bold py-3 px-6 rounded-lg hover:from-yellow-300 hover:to-yellow-400 transition-all"
                >
                  <Star className="w-5 h-5" />
                  View Premium Dashboard
                </Link>
              </div>
            )}
          </main>

          <footer className="mt-auto pt-8">
            <div className="border border-slate-600 rounded-lg py-3 flex items-center justify-center gap-3">
              <span className="text-slate-400">Secured on</span>
              <BlockDagLogo className="w-6 h-6" />
              <span className="font-bold">BlockDAG</span>
            </div>
            <div className="h-20 w-full bg-gradient-to-t from-slate-900 to-transparent -mb-4 mt-2"></div>
          </footer>
        </div>
      </div>
    </>
  );
}
