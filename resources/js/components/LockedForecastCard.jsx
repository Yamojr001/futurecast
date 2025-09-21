// resources/js/components/LockedForecastCard.jsx
import { motion } from 'framer-motion';

export function LockedForecastCard({ title }) {
    // Animation for the card
    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { type: 'spring', stiffness: 100, damping: 10 }
        }
    };

    return (
        <motion.div variants={cardVariants}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md text-center text-slate-400 h-full flex flex-col justify-center">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs">Forecast (Locked)</p>
            </div>
        </motion.div>
    );
}