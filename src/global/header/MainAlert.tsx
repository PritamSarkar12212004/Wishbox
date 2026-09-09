import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Theme from '@/assets/Theme/Theme';
import HeaderData from './data/HeaderData';

const FlashAlert = () => {
    const [isPaused, setIsPaused] = useState(false);
    const duplicatedMessages = [...HeaderData.saleMessages, ...HeaderData.saleMessages];
    const separator = ' • ';
    const marqueeStyle: React.CSSProperties = {
        display: 'inline-block',
        whiteSpace: 'nowrap',
        animation: isPaused ? 'none' : 'flashAlertMarquee 30s linear infinite',
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="relative overflow-hidden"
                style={{
                    backgroundColor: Theme.colors.surfaceAlt,
                    borderBottom: `1px solid ${Theme.colors.border}`,
                    boxShadow: Theme.Shadow?.sm || '0 1px 3px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className="flex items-center  sm:px-6 py-2.5">
                    <div className="flex-1 overflow-hidden">
                        <div style={marqueeStyle}>
                            {duplicatedMessages.map((message, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center text-xs sm:text-sm font-medium"
                                    style={{
                                        color: Theme.colors.text,
                                        letterSpacing: '0.3px',
                                    }}
                                >
                                    {message}
                                    <span
                                        className="mx-2 sm:mx-3"
                                        style={{
                                            color: Theme.colors.textMuted,
                                            opacity: 0.4,
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        {separator}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <style>{`
                        @keyframes flashAlertMarquee {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                    `}</style>
            </motion.div>
        </AnimatePresence>
    );
};

export default FlashAlert;