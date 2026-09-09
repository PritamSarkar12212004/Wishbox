import Theme from '@/assets/Theme/Theme';
import { ShoppingBag } from 'lucide-react';

function ProductPage() {
    return (
        <div
            className="min-h-full px-6 py-10"
            style={{ backgroundColor: Theme.colors.background }}
        >
            <div className="flex items-center gap-3 mb-8">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: Theme.colors.primaryLight }}
                >
                    <ShoppingBag size={22} style={{ color: Theme.colors.primaryDark }} />
                </div>
                <h1
                    className="text-3xl font-bold"
                    style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
                >
                    Shop All
                </h1>
            </div>
            <p style={{ color: Theme.colors.textLight }}>
                Explore our full collection of handmade paper decorations.
            </p>
        </div>
    );
}

export default ProductPage;