const Theme = {
    colors: {
        background: '#FAF6F0',
        surface: '#FFFFFF',
        surfaceAlt: '#F5EFE6',
        primary: '#7C9A7A',
        primaryLight: '#A8C5A5',
        primaryDark: '#5A7A58',
        secondary: '#D4A574',
        tertiary: '#E8C4C4',
        accent: '#C97B5D',
        accentLight: '#DEA082',
        accentDark: '#A85E3F',
        text: '#2C2420',
        textLight: '#6B5D55',
        textMuted: '#9A8D85',
        border: '#E8E0D8',
        borderStrong: '#D5CCC2',
        white: '#FFFFFF',
        black: '#1A1614',
        gold: '#C9A87C',
    },
    Alert: {
        FlashSale: {
            background: '#C97B5D',
            backgroundGradient: 'linear-gradient(135deg, #C97B5D 0%, #DEA082 50%, #C97B5D 100%)',
            text: '#FAF6F0',
            border: '#A85E3F',
            badgeBackground: '#2C2420',
            badgeText: '#FAF6F0',
        },
        Info: {
            background: '#F0F5EE',
            text: '#2C2420',
            border: '#7C9A7A',
        },
        Success: {
            background: '#E8F0E6',
            text: '#2C2420',
            border: '#7C9A7A',
        },
    },

    Typography: {
        // Geist ships with the app via @fontsource — no network font requests.
        fontFamily: "'Geist Variable', system-ui, -apple-system, 'Segoe UI', sans-serif",
        // System serif keeps the editorial heading look with zero download cost.
        headingFamily: "Georgia, 'Times New Roman', serif",
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '2rem',
        },
    },

    Shadow: {
        sm: '0 1px 3px rgba(44, 36, 32, 0.08)',
        md: '0 4px 12px rgba(44, 36, 32, 0.10)',
        lg: '0 8px 24px rgba(44, 36, 32, 0.12)',
        xl: '0 16px 40px rgba(44, 36, 32, 0.16)',
    },

    BorderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
    },
};

export default Theme;