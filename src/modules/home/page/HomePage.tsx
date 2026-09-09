import Theme from '@/assets/Theme/Theme';
import { Sparkles, ArrowRight } from 'lucide-react';

function HomePage() {
    return (
        <div
            className="min-h-full flex flex-col items-center justify-center px-8 py-16 text-center"
            style={{ backgroundColor: Theme.colors.background }}
        >
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-8"
                style={{ backgroundColor: Theme.colors.primaryLight }}
            >
                <Sparkles size={32} style={{ color: Theme.colors.primaryDark }} />
            </div>
            <h1
                className="text-4xl sm:text-5xl font-bold mb-4"
                style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
            >
                Welcome to Wishbox
            </h1>
            <p className="text-lg mb-10 max-w-xl" style={{ color: Theme.colors.textLight }}>
                Handmade paper decorations, curated with care. Explore our collections and
                make something beautiful.
            </p>
            <a
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-medium transition-all hover:opacity-90"
                style={{
                    backgroundColor: Theme.colors.primary,
                    color: Theme.colors.white,
                    boxShadow: Theme.Shadow?.md,
                }}
            >
                Shop the Collection
                <ArrowRight size={20} />
            </a>
        </div>
    );
}

export default HomePage;
