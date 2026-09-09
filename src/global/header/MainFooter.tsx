import Theme from '@/assets/Theme/Theme';

function MainFooter() {
    return (
        <footer
            className="w-full h-48 flex items-center justify-center"
            style={{
                backgroundColor: Theme.colors.surfaceAlt, // soft warm gray
                borderTop: `1px solid ${Theme.colors.border}`,
                color: Theme.colors.textMuted,
                fontFamily: Theme.Typography?.fontFamily || 'Inter, sans-serif',
            }}
        >
            <p className="text-sm">
                © 2026 PaperCraft Decor — Handmade Paper Decorations
            </p>
        </footer>
    );
}

export default MainFooter;