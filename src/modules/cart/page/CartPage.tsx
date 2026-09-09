import Theme from '@/assets/Theme/Theme';
import { ShoppingCart, Trash2 } from 'lucide-react';

const cartItems = [
    { id: 1, name: 'Paper Lantern — Sage', qty: 2, price: 24.0 },
    { id: 2, name: 'Origami Crane Set', qty: 1, price: 18.5 },
];

function CartPage() {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    return (
        <div className="min-h-full px-6 py-10" style={{ backgroundColor: Theme.colors.background }}>
            <h1
                className="text-3xl font-bold mb-8"
                style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
            >
                Cart
            </h1>
            <div className="max-w-3xl flex flex-col gap-4">
                {cartItems.map((item) => (
                    <div
                        key={item.id}
                        className="p-5 rounded-xl border flex items-center justify-between"
                        style={{
                            backgroundColor: Theme.colors.surface,
                            borderColor: Theme.colors.border,
                            boxShadow: Theme.Shadow?.sm,
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: Theme.colors.primaryLight }}
                            >
                                <ShoppingCart size={20} style={{ color: Theme.colors.primaryDark }} />
                            </div>
                            <div>
                                <p className="font-semibold" style={{ color: Theme.colors.text }}>
                                    {item.name}
                                </p>
                                <p className="text-sm" style={{ color: Theme.colors.textMuted }}>
                                    Qty {item.qty} × ${item.price.toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span style={{ color: Theme.colors.accent }}>
                                ${(item.price * item.qty).toFixed(2)}
                            </span>
                            <Trash2 size={18} style={{ color: Theme.colors.textMuted }} />
                        </div>
                    </div>
                ))}
                <div
                    className="mt-2 p-5 rounded-xl border flex items-center justify-between"
                    style={{ backgroundColor: Theme.colors.surfaceAlt, borderColor: Theme.colors.border }}
                >
                    <span className="font-semibold" style={{ color: Theme.colors.text }}>
                        Subtotal
                    </span>
                    <span className="font-bold" style={{ color: Theme.colors.accentDark }}>
                        ${subtotal.toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default CartPage;
