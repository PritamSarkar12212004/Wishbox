import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Gift, ShoppingCart } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { inr } from '../data/productData';
import { cartStore } from '../store/store';
import { toast } from 'sonner';

const BUNDLE_ITEMS = [
    {
        id: 'main',
        name: 'Premium Decorative Paper Sheets',
        price: 249,
        image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=320&q=80',
    },
    {
        id: 'ribbon',
        name: 'Decorative Craft Ribbon',
        price: 149,
        image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=320&q=80',
    },
    {
        id: 'box',
        name: 'Paper Gift Box Set',
        price: 399,
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=320&q=80',
    },
];

const REGULAR_TOTAL = BUNDLE_ITEMS.reduce((sum, i) => sum + i.price, 0);
const BUNDLE_PRICE = 699;

function BundleSection() {
    const [items, setItems] = useState<Record<string, boolean>>({
        main: true,
        ribbon: true,
        box: true,
    });
    const [adding, setAdding] = useState(false);

    const total = useMemo(
        () => BUNDLE_ITEMS.filter((i) => items[i.id]).reduce((sum, i) => sum + i.price, 0),
        [items]
    );
    const selectedCount = Object.values(items).filter(Boolean).length;
    const bundleApplied = selectedCount === BUNDLE_ITEMS.length;
    const saving = REGULAR_TOTAL - BUNDLE_PRICE;

    const toggle = (id: string) => setItems((prev) => ({ ...prev, [id]: !prev[id] }));

    const addBundle = () => {
        if (selectedCount === 0) return;
        setAdding(true);
        window.setTimeout(() => {
            cartStore.add(selectedCount);
            setAdding(false);
            toast.success('Bundle added to cart', {
                description: `${selectedCount} items · ${inr(bundleApplied ? BUNDLE_PRICE : total)}`,
            });
        }, 650);
    };

    return (
        <section
            className="rounded-2xl border bg-white/60 p-5 md:p-7"
            style={{ borderColor: Theme.colors.border, boxShadow: Theme.Shadow.sm }}
            aria-label="Frequently bought together"
        >
            <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: Theme.colors.text }}>
                <Gift size={18} style={{ color: Theme.colors.primaryDark }} />
                Frequently Bought Together
            </h2>

            <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-center">
                <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3">
                    {BUNDLE_ITEMS.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-2 sm:gap-3">
                            {idx > 0 && (
                                <span className="text-lg font-bold" style={{ color: Theme.colors.borderStrong }}>+</span>
                            )}
                            <div
                                className="relative w-24 sm:w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-all"
                                style={{
                                    borderColor: items[item.id] ? Theme.colors.primaryDark : Theme.colors.border,
                                    opacity: items[item.id] ? 1 : 0.55,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggle(item.id)}
                                    aria-pressed={items[item.id]}
                                    aria-label={`${items[item.id] ? 'Remove' : 'Add'} ${item.name} from bundle`}
                                    className="block w-full"
                                >
                                    <img src={item.image} alt="" loading="lazy" decoding="async"
                                        className="h-28 sm:h-32 w-full object-cover" />
                                </button>
                                <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md border-2"
                                    style={{
                                        borderColor: items[item.id] ? Theme.colors.primaryDark : Theme.colors.borderStrong,
                                        backgroundColor: items[item.id] ? Theme.colors.primaryDark : 'white',
                                    }}
                                >
                                    {items[item.id] && <Check size={12} strokeWidth={3} className="text-white" />}
                                </span>
                                <div className="px-2 py-1.5">
                                    <p className="truncate text-[11px] font-semibold" style={{ color: Theme.colors.text }}>
                                        {item.name}
                                    </p>
                                    <p className="text-xs font-bold" style={{ color: Theme.colors.primaryDark }}>
                                        {inr(item.price)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Summary */}
                <div className="w-full md:w-64 shrink-0 rounded-2xl border p-4"
                    style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}>
                    <div className="flex items-baseline justify-between text-sm">
                        <span style={{ color: Theme.colors.textMuted }}>{selectedCount} items</span>
                        {bundleApplied ? (
                            <div className="text-right">
                                <p className="text-lg font-extrabold" style={{ color: Theme.colors.text }}>{inr(BUNDLE_PRICE)}</p>
                                <p className="text-xs line-through" style={{ color: Theme.colors.textMuted }}>{inr(REGULAR_TOTAL)}</p>
                            </div>
                        ) : (
                            <p className="text-lg font-extrabold" style={{ color: Theme.colors.text }}>{inr(total)}</p>
                        )}
                    </div>
                    <AnimatePresence>
                        {bundleApplied && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden text-xs font-semibold"
                                style={{ color: '#2E7D5B' }}
                            >
                                Bundle price applied · You save {inr(saving)}
                            </motion.p>
                        )}
                    </AnimatePresence>
                    <button
                        type="button"
                        onClick={addBundle}
                        disabled={selectedCount === 0 || adding}
                        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                        style={{ backgroundColor: Theme.colors.primaryDark }}
                    >
                        <ShoppingCart size={15} />
                        {adding ? 'Adding…' : `Add Bundle · ${inr(bundleApplied ? BUNDLE_PRICE : total)}`}
                    </button>
                </div>
            </div>
        </section>
    );
}

export default memo(BundleSection);