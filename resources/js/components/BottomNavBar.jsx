// resources/js/components/BottomNavBar.jsx
import { Home, BarChart2, Cpu } from 'lucide-react';

export function BottomNavBar() {
    return (
        <div className="relative h-24 w-full">
            {/* The SVG Wave */}
            <svg viewBox="0 0 375 100" className="absolute bottom-0 w-full h-auto" preserveAspectRatio="none">
                <path d="M0 100 C 50 10 80 10 187.5 50 C 295 90 325 90 375 0 L 375 100 Z" fill="#1E203B"></path>
            </svg>
            
            {/* The Icons */}
            <div className="absolute inset-0 flex items-center justify-around px-6">
                <button className="text-slate-400 hover:text-white transition-colors">
                    <Cpu size={24} />
                </button>
                <button className="absolute bottom-11 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <Home size={28} className="text-white" />
                </button>
                <button className="text-slate-400 hover:text-white transition-colors">
                    <BarChart2 size={24} />
                </button>
            </div>
        </div>
    );
}