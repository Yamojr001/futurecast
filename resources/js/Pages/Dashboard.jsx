import { Head, router } from '@inertiajs/react';
import { ChevronDown, ArrowUp, Home, BarChart2, Cpu } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserDropdown } from '@/components/UserDropdown';
import { motion } from 'framer-motion';

// --- Main Dashboard Component - FINAL MASTERPIECE VERSION ---
export default function Dashboard({ auth, countries, selectedCountry, forecasts }) {

    const handleCountryChange = (country) => {
        if (country === selectedCountry) return;
        router.get(route('dashboard'), { country }, { preserveScroll: true });
    };

    // Animation variants
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
    const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 15, stiffness: 100 } } };

    return (
        <>
            <Head title="Dashboard" />
            
            {/* Main Full-Screen Wrapper with Gradient */}
            <div className="min-h-screen w-full bg-gradient-to-br from-[#1E203B] to-slate-900 text-white font-sans flex flex-col">

                {/* --- 1. Main Content Area (Takes up all available space) --- */}
                <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">

                    {/* Header */}
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <p className="text-slate-400 text-sm md:text-base">Hello, {auth.user.name}</p>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center gap-2 text-2xl md:text-3xl font-bold cursor-pointer">
                                        {selectedCountry} <ChevronDown className="h-6 w-6 mt-1" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                                    {countries.map(country => (<DropdownMenuItem key={country} onSelect={() => handleCountryChange(country)} className="cursor-pointer"><span>{country}</span></DropdownMenuItem>))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="hidden md:block"><UserDropdown user={auth.user} /></div>
                    </header>

                    {/* --- 2. The Main Content Container (This is the key to the layout) --- */}
                    {/* It's a flex container that pushes the top and bottom content apart */}
                    <div className="flex flex-col justify-between h-[calc(100%-100px)]">
                        
                        {/* TOP CARDS */}
                        <motion.div 
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {forecasts.map((forecast) => (
                                <motion.div key={forecast.id} variants={cardVariants} whileHover={{ scale: 1.02, y: -4 }}>
                                    <ForecastCard forecast={forecast} />
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* BOTTOM LOCKED CARDS */}
                        <motion.div 
                            className="grid grid-cols-2 gap-6 mt-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={cardVariants}><LockedForecastCard title="Unemployment" /></motion.div>
                            <motion.div variants={cardVariants}><LockedForecastCard title="Interest Rate" /></motion.div>
                        </motion.div>
                        
                    </div>
                </div>

                {/* --- 3. The Bottom Navigation Bar (Now always visible) --- */}
                <div className="sticky bottom-0 h-24 w-full">
                    <BottomNavBar />
                </div>
            </div>
        </>
    );
}


// --- UI Components for the Dashboard ---

function ForecastCard({ forecast }) {
    return (
        <div onClick={() => router.get(route('forecasts.show', forecast.id))} className="h-full rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-slate-800/10 to-transparent p-5 backdrop-blur-lg cursor-pointer">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-300">{forecast.title}</p>
                    <p className="text-4xl font-bold mt-1">{forecast.freeSummary}</p>
                </div>
                <div className="rounded-full bg-slate-700/50 p-2 border border-white/10"><ArrowUp className="h-5 w-5 text-green-400" /></div>
            </div>
            <div className="mt-6 border-t border-white/20 pt-4">
                <p className="text-sm text-slate-400">Basic Prediction</p>
                <p className="text-sm text-yellow-400 font-semibold">Unlock detailed accuracy - Stake tokens</p>
            </div>
        </div>
    );
}

function LockedForecastCard({ title }) {
    return (
        <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md text-center text-slate-400 flex flex-col justify-center items-center">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs">Forecast (Locked)</p>
        </div>
    );
}

function BottomNavBar() {
    return (
        <div className="relative h-full w-full">
            <svg viewBox="0 0 375 100" className="absolute bottom-0 w-full h-auto" preserveAspectRatio="none"><path d="M0 100 C 50 10 80 10 187.5 50 C 295 90 325 90 375 0 L 375 100 Z" fill="#1E203B"></path></svg>
            <div className="absolute inset-0 flex items-center justify-around px-6">
                <button className="text-slate-400 hover:text-white transition-colors"><Cpu size={24} /></button>
                <button className="absolute bottom-11 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Home size={28} className="text-white" /></button>
                <button className="text-slate-400 hover:text-white transition-colors"><BarChart2 size={24} /></button>
            </div>
        </div>
    );
}