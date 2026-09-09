import Theme from '@/assets/Theme/Theme';
import { Heart } from 'lucide-react';

const sampleItems = [
    { id: 1, name: 'Paper Lantern — Sage', price: '$24.00' },
    { id: 2, name: 'Origami Crane Set', price: '$18.50' },
    { id: 3, name: 'Gift Wrap Roll — Gold', price: '$6.99' },
];

function WishlistPage() {
    return (
        <div className="min-h-full px-6 py-10" style={{ backgroundColor: Theme.colors.background }}>
            <h1
                className="text-3xl font-bold mb-8"
                style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
            >
                Wishlist
            </h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sampleItems.map((item) => (
                    <div
                        key={item.id}
                        className="p-6 rounded-xl border flex flex-col gap-3"
                        style={{
                            backgroundColor: Theme.colors.surface,
                            borderColor: Theme.colors.border,
                            boxShadow: Theme.Shadow?.sm,
                        }}
                    >
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: Theme.colors.tertiary }}
                        >
                            <Heart size={20} style={{ color: Theme.colors.accentDark }} />
                        </div>
                        <span className="font-semibold" style={{ color: Theme.colors.text }}>
                            {item.name}
                        </span>
                        <span style={{ color: Theme.colors.accent }}>{item.price}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default WishlistPage;
