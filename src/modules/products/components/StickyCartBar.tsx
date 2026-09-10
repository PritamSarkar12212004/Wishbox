import { memo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Zap } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { PRODUCT, inr } from '../data/productData';
import { cartStore } from '../store/store';
import { toast } from 'sonner';

const BUY_ZONE_ID = 'purchase-zone';

function StickyCartBar({ price, qty }: { price: number; qty: number }) {
    const [show, setShow] = useState(false);
    const [adding, setAdding] = useState(false);
    const buyZone = useRef<HTMLElement | null>(null);

    useEffect(() => {
        buyZone.current = document.getElementById(BUY_ZONE_ID);
    }, []);

    useEffect(() => {
        const onScroll = () => {
            const zone = buyZone.current;
            if (!zone) return;
            const rect = zone.getBoundingClientRect();
            // Show the sticky bar once the purchase area has scrolled past the top.
            setShow(rect.bottom < 120);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Respect users who prefer reduced motion — the bar still works, just static via CSS.
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: 96, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 96, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    className="fixed inset-x-0 bottom-0 z-30 lg:hidden"
                    style={{ backgroundColor: 'rgba(255,255,255,0.96)', borderTop: `1px solid ${Theme.colors.border}`, boxShadow: Theme.Shadow.lg }}
                >
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="min-w-0">
                            <p className="text-base font-extrabold tabular-nums" style={{ color: Theme.colors.text }}>
                                {inr(price * qty)}
                            </p>
                            <p className="truncate text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                {PRODUCT.title}
                            </p>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setAdding(true);
                                    window.setTimeout(() => {
                                        setAdding(false);
                                        cartStore.add(qty);
                                        toast.success(`${qty} pack${qty > 1 ? 's' : ''} added to cart`);
                                    }, 550);
                                }}
                                disabled={adding}
                                className="flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-bold text-white active:scale-[0.97] disabled:opacity-60"
                                style={{ backgroundColor: Theme.colors.primary }}
                            >
                                <ShoppingCart size={15} />
                                {adding ? 'Adding…' : 'Add'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    cartStore.add(qty);
                                    toast.success('Order placed (demo checkout)', { description: 'This is a mock checkout.' });
                                }}
                                className="flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-bold text-white active:scale-[0.97]"
                                style={{ backgroundColor: Theme.colors.accent }}
                            >
                                <Zap size={15} />
                                Buy
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export { BUY_ZONE_ID };
export default memo(StickyCartBar);