// Show.jsx
import { useState, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import {
  ArrowLeft,
  LoaderCircle,
  Eye,
  Star,
  TrendingUp,
  BarChart,
  Shield,
} from "lucide-react";
import { ethers } from "ethers";

// ABIs
import FutureCastABI from "@/abi/FutureCast.json";
import ERC20ABI from "@/abi/ERC20.json";

// Contract addresses
const dagTokenAddress = "0x3aef535bf937185735aaf5b803983adc110e9d76";
const futureCastAddress = "0x4058a46b47ccda82f3c7d63beb8547437ef1a41a";

// Custom stake button
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

// Logo
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

  // Debug forecast props
  console.log("📡 Incoming forecast props:", forecast);
  const rawId = forecast?.onchain_id ?? forecast?.id;
  const onChainForecastId = Number(rawId);
  console.log("🔢 Using forecast ID:", onChainForecastId);

  useEffect(() => {
    if (userStakeLevel >= 50) {
      setIsUnlocked(true);
      if (forecast?.unlockedContent) {
        setUnlockedContent(
          typeof forecast.unlockedContent === "string"
            ? JSON.parse(forecast.unlockedContent)
            : forecast.unlockedContent
        );
      }
    }
  }, [forecast, userStakeLevel]);

  if (!forecast) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1E203B] to-slate-900 text-white font-sans p-4 flex flex-col items-center justify-center text-center">
        <Head title="Loading Forecast..." />
        <LoaderCircle className="w-12 h-12 animate-spin mb-4" />
        <h1 className="text-3xl font-bold">Forecast Not Found</h1>
        <p className="text-slate-400 mt-2">
          The forecast you are looking for does not exist in the database.
        </p>
        <Link
          href={route("dashboard")}
          className="mt-6 bg-yellow-400 text-slate-900 font-bold py-2 px-4 rounded-lg"
        >
          &larr; Go Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleStake = async (amount) => {
    if (!window.ethereum) {
      alert("Please install MetaMask.");
      return;
    }

    if (!ethers.isAddress(dagTokenAddress) || !ethers.isAddress(futureCastAddress)) {
      console.error("Invalid contract address:", { dagTokenAddress, futureCastAddress });
      alert("Invalid contract configuration.");
      return;
    }

    // Validate forecast ID
    if (!rawId || isNaN(onChainForecastId) || onChainForecastId <= 0) {
      console.error("🚨 Invalid or missing forecast ID:", { rawId, forecast });
      alert("Invalid forecast ID (frontend). Please contact support.");
      setIsLoading(false);
      setFeedback("");
      return;
    }

    setIsLoading(true);
    setFeedback(`Preparing to stake ${amount}...`);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const me = await signer.getAddress();

      const futureCastContract = new ethers.Contract(futureCastAddress, FutureCastABI, signer);
      const tokenContract = new ethers.Contract(dagTokenAddress, ERC20ABI, signer);

      // Check if forecast exists
      try {
        const onchain = await futureCastContract.forecasts(onChainForecastId);
        if (!onchain || onchain[0] === 0n) {
          alert("Forecast ID does not exist on-chain for this contract. Aborting.");
          setIsLoading(false);
          setFeedback("");
          return;
        }
      } catch (readErr) {
        console.warn("Forecast read failed:", readErr);
        alert("Forecast ID does not exist on-chain for this contract. Aborting.");
        setIsLoading(false);
        setFeedback("");
        return;
      }

      let decimals = 18;
      let tokenLooksOK = true;
      try {
        decimals = Number(await tokenContract.decimals());
        const sym = await tokenContract.symbol();
        console.log("ERC20 token metadata:", { symbol: sym, decimals });
      } catch (err) {
        tokenLooksOK = false;
        console.warn("Token metadata fetch failed:", err);
      }

      const stakeAmountInWei = ethers.parseUnits(String(amount), decimals);

      // Attempt native staking
      try {
        setFeedback("Confirm in wallet (native payment)...");
        const tierIdx = amount === 50 ? 0 : 1;
        const tx = await futureCastContract.stakeAndUnlock(onChainForecastId, tierIdx, {
          value: stakeAmountInWei,
        });
        await tx.wait();
        setFeedback("Success! Forecast unlocked (native).");
        setIsUnlocked(true);
        if (forecast?.unlockedContent) {
          setUnlockedContent(
            typeof forecast.unlockedContent === "string"
              ? JSON.parse(forecast.unlockedContent)
              : forecast.unlockedContent
          );
        }
        alert("🎉 Success — forecast unlocked (native payment).");
        setIsLoading(false);
        return;
      } catch (nativeErr) {
        console.warn("Native staking failed:", nativeErr);
      }

      // Fallback to ERC20 path
      if (!tokenLooksOK) {
        alert("Token may not be standard ERC20. Approval may fail.");
      }

      const rawBalance = await tokenContract.balanceOf(me);
      if (BigInt(rawBalance) < BigInt(stakeAmountInWei)) {
        alert("Insufficient token balance. Please acquire more tokens.");
        setIsLoading(false);
        setFeedback("");
        return;
      }

      // Approve
      setFeedback("1/2: Approving token transfer...");
      const approveTx = await tokenContract.approve(futureCastAddress, stakeAmountInWei);
      await approveTx.wait();

      // Stake
      setFeedback("2/2: Staking via contract (ERC20)...");
      const tierIdx = amount === 50 ? 0 : 1;
      const stakeTx = await futureCastContract.stakeAndUnlock(onChainForecastId, tierIdx);
      await stakeTx.wait();

      setFeedback("Success! Forecast unlocked (ERC20).");
      setIsUnlocked(true);
      if (forecast?.unlockedContent) {
        setUnlockedContent(
          typeof forecast.unlockedContent === "string"
            ? JSON.parse(forecast.unlockedContent)
            : forecast.unlockedContent
        );
      }
      alert("🎉 Success — forecast unlocked (ERC20).");
    } catch (err) {
      console.error("❌ Staking failed:", err);
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
                  <span className="text-sm text-slate-300">
                    {isUnlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-400 mb-4">{forecast.freeSummary}</div>

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

                    {unlockedContent.keyFactors && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-slate-300 mb-2">Key Factors:</h4>
                        <ul className="text-slate-400 text-sm space-y-1">
                          {unlockedContent.keyFactors.map((factor, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <TrendingUp className="w-3 h-3 mt-1 text-yellow-400 flex-shrink-0" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {unlockedContent.riskAssessment && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-slate-300 mb-2">Risk Assessment:</h4>
                        <p className="text-slate-400 text-sm">{unlockedContent.riskAssessment}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!isUnlocked && (
              <>
                <p className="text-slate-300 text-center">
                  Stake tokens to unlock detailed analysis, confidence scores, and premium insights
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center flex flex-col gap-3">
                    <h3 className="font-bold text-yellow-400">Stake 50 tokens</h3>
                    <p className="text-sm font-semibold">Basic Unlock</p>
                    <p className="text-xs text-slate-400 flex-grow">
                      Basic analysis and confidence score
                    </p>
                    <StakeButton
                      onStake={handleStake}
                      amount={50}
                      isLoading={isLoading}
                      feedback={feedback}
                    />
                  </div>
                  <div className="text-center flex flex-col gap-3">
                    <h3 className="font-bold text-yellow-400">Stake 100 tokens</h3>
                    <p className="text-sm font-semibold">Full Unlock</p>
                    <p className="text-xs text-slate-400">
                      Complete analysis with risk assessment
                    </p>
                    <p className="text-xs text-slate-400 flex-grow">Key factors & trends</p>
                    <StakeButton
                      onStake={handleStake}
                      amount={100}
                      isLoading={isLoading}
                      feedback={feedback}
                    />
                  </div>
                </div>
              </>
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
