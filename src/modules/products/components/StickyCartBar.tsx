import { memo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Zap } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { inr } from '@/lib/format';
import type { CatalogProduct } from '../data/catalogData';

const BUY_ZONE_ID = 'purchase-zone';

type StickyCartBarProps = {
    product: CatalogProduct;
    qty: number;
    /** Payable total for the current selection, coupon discount included. */
    total: number;
    onAdd: () => void;
    onBuy: () => void;
};

function StickyCartBar({ product, qty, total, onAdd, onBuy }: StickyCartBarProps) {
    const [show, setShow] = useState(false);
    const [adding, setAdding] = useState(false);
    const buyZone = useRef<HTMLElement | null>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const addTimer = useRef<number | null>(null);

    useEffect(() => {
        buyZone.current = document.getElementById(BUY_ZONE_ID);
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

    /**
     * The bar is fixed, so reserve its height at the page bottom. Without this
     * the footer's last row sits underneath it on phones.
     */
    useEffect(() => {
        const root = document.documentElement;
        if (!show) {
            root.style.removeProperty('--sticky-action-offset');
            return;
        }
        const measure = () => {
            const height = barRef.current?.offsetHeight ?? 0;
            root.style.setProperty('--sticky-action-offset', `${height}px`);
        };
        measure();
        const observer = new ResizeObserver(measure);
        if (barRef.current) observer.observe(barRef.current);
        window.addEventListener('orientationchange', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('orientationchange', measure);
            root.style.removeProperty('--sticky-action-offset');
        };
    }, [show]);

    useEffect(
        () => () => {
            if (addTimer.current) window.clearTimeout(addTimer.current);
        },
        []
    );

    function handleAdd() {
        setAdding(true);
        onAdd();
        if (addTimer.current) window.clearTimeout(addTimer.current);
        addTimer.current = window.setTimeout(() => setAdding(false), 900);
    }

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    ref={barRef}
                    initial={{ y: 96, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 96, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    className="fixed inset-x-0 bottom-0 z-30 lg:hidden"
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.96)',
                        borderTop: `1px solid ${Theme.colors.border}`,
                        boxShadow: Theme.Shadow.lg,
                        backdropFilter: 'blur(8px)',
                        // Keep the buttons clear of the iOS home indicator.
                        paddingBottom: 'env(safe-area-inset-bottom)',
                    }}
                >
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-base font-extrabold tabular-nums" style={{ color: Theme.colors.text }}>
                                {inr(total)}
                            </p>
                            <p className="truncate text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                {product.name} · Qty {qty}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <button
                                type="button"
                                onClick={handleAdd}
                                disabled={adding}
                                className="flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-bold text-white active:scale-[0.97] disabled:opacity-60"
                                style={{ backgroundColor: Theme.colors.primary }}
                            >
                                <ShoppingCart size={15} />
                                {adding ? 'Added' : 'Add'}
                            </button>
                            <button
                                type="button"
                                onClick={onBuy}
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
