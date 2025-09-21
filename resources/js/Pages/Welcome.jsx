import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import axios from 'axios';

// SVG for the BlockDAG logo (no changes here)
function BlockDagLogo({ className }) {
    // ... same as before
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

// FloatingLogos component (no changes here)
function FloatingLogos() {
    // ... same as before
    const logos = Array.from({ length: 8 }).map((_, i) => ({ id: i, /* ... */ }));
    return (
        <div className="absolute inset-0 z-0">
             {/* The random floating logos in the background */}
            {logos.map(logo => ( <motion.div key={logo.id}> <BlockDagLogo className="w-full h-full opacity-10" /> </motion.div> ))}
            {/* The main floating brand logo */}
            <motion.div className="absolute top-10 left-10 flex items-center gap-3 z-10" /* ... */ >
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} >
                    <BlockDagLogo className="w-8 h-8" />
                </motion.div>
                <span className="text-white font-semibold text-lg tracking-wider">BlockDAG</span>
            </motion.div>
        </div>
    );
}

// Main Welcome component with the fix
export default function Welcome({ auth }) { // The auth prop contains the csrf token
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState('Connect');

    const handleWalletConnect = async () => {
        if (!window.ethereum) return alert("Please install MetaMask.");
        setIsLoading(true);
        setFeedback('Connecting...');

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const address = accounts[0];
            setFeedback('Verifying...');

            // --- THIS IS THE FIX ---
            // We now include the CSRF token in the headers of our request.
            await axios.post(route('wallet.login'), {
                address: address,
            });
            // --- END OF FIX ---
            
            // If the login is successful, Inertia will redirect to the dashboard
            router.visit(route('dashboard'), { onFinish: () => setIsLoading(false) });

        } catch (error) {
            console.error("Connection failed:", error);
            // This error is helpful. Check the browser console now.
            if (error.response && error.response.status === 419) {
                alert("Connection failed: Page session expired. Please refresh and try again.");
            } else {
                alert("Failed to connect or log in. Please try again.");
            }
            setFeedback('Connect');
            setIsLoading(false);
        }
    };
    
    // Breeze automatically configures axios to include the CSRF token.
    // We just need to make sure the meta tag is present. The layout does this for us.

    return (
        <>
            <Head title="Welcome to FutureCast" />
            <div className="relative min-h-screen w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                <FloatingLogos />
                <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-gradient-to-br from-purple-500 to-slate-900 rounded-full filter blur-3xl opacity-30"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-gradient-to-tl from-cyan-500 to-slate-900 rounded-full filter blur-3xl opacity-30"></div>
                <motion.div
                    className="absolute top-1/4 left-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl"
                    animate={{ x: [-100, -50, -100], y: [-20, 20, -20], scale: [1, 1.1, 1] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <motion.div
                    className="z-10 text-center flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-7xl font-bold text-white tracking-tighter">FUTURECAST</h1>
                    <p className="text-xl text-white/70 mt-2">Staking to unlock accuracy</p>
                    <div className="mt-24 flex flex-col items-center gap-4">
                        <p className="text-lg font-semibold text-white/80">CONNECT WALLET (MetaMask)</p>
                        <button
                            onClick={handleWalletConnect}
                            disabled={isLoading}
                            className="w-64 h-12 text-center text-lg font-bold bg-white/90 rounded-xl hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                            <span className="text-slate-900">{feedback}</span>
                        </button>
                        <a href="#" className="text-sm text-white/60 hover:text-white mt-2">
                            Why Connect my wallet?
                        </a>
                    </div>
                </motion.div>
            </div>
        </>
    );
}