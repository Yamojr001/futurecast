// resources/js/components/AnimatedCard.jsx
import { motion } from 'framer-motion';

// This component wraps any content and makes it animate in and react to hover
export function AnimatedCard({ children }) {
    // Define the animation properties
    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { type: 'spring', stiffness: 100, damping: 10 }
        }
    };

    return (
        <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.03, y: -5 }} // Animate on hover
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
            {children}
        </motion.div>
    );
}