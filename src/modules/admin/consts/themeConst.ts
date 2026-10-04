/**
 * Website themes the admin can pick from.
 *
 * Each preset is a complete palette for a storefront: background, surface,
 * accent, text and corner radius. `papercraft` is the storefront's real look
 * today (it mirrors `Theme.ts`), so the default selection matches what shoppers
 * already see; the other nine are demo alternatives.
 */

export type WebsiteTheme = {
    id: string;
    name: string;
    /** One line on the card explaining the look. */
    tagline: string;
    /** Single word shown as a chip — helps scanning ten cards quickly. */
    mood: string;
    colors: {
        background: string;
        surface: string;
        primary: string;
        accent: string;
        text: string;
        muted: string;
        border: string;
    };
    /** Corner radius in px — the fastest way to make a theme read differently. */
    radius: number;
};

export const DEFAULT_WEBSITE_THEME_ID = 'papercraft';

export const WEBSITE_THEMES: WebsiteTheme[] = [
    {
        id: 'papercraft',
        name: 'Papercraft',
        tagline: 'Warm paper, sage green and hand-thrown clay.',
        mood: 'Warm',
        radius: 12,
        colors: {
            background: '#FAF6F0',
            surface: '#FFFFFF',
            primary: '#7C9A7A',
            accent: '#C97B5D',
            text: '#2C2420',
            muted: '#9A8D85',
            border: '#E8E0D8',
        },
    },
    {
        id: 'midnight',
        name: 'Midnight Ink',
        tagline: 'Charcoal canvas with electric indigo accents.',
        mood: 'Dark',
        radius: 10,
        colors: {
            background: '#0E1116',
            surface: '#171C24',
            primary: '#6366F1',
            accent: '#22D3EE',
            text: '#E8ECF3',
            muted: '#8A94A6',
            border: '#262E3A',
        },
    },
    {
        id: 'rose',
        name: 'Rose Atelier',
        tagline: 'Blush silk, deep plum and rounded corners.',
        mood: 'Romantic',
        radius: 16,
        colors: {
            background: '#FFF6F8',
            surface: '#FFFFFF',
            primary: '#E8749B',
            accent: '#7B3F6E',
            text: '#3A1F33',
            muted: '#A88A9B',
            border: '#F3DCE4',
        },
    },
    {
        id: 'forest',
        name: 'Forest Market',
        tagline: 'Deep evergreen against raw linen.',
        mood: 'Organic',
        radius: 8,
        colors: {
            background: '#F4F7F2',
            surface: '#FFFFFF',
            primary: '#1F5E45',
            accent: '#C8A24A',
            text: '#16281F',
            muted: '#7C8C82',
            border: '#DCE6DD',
        },
    },
    {
        id: 'ocean',
        name: 'Ocean Minimal',
        tagline: 'Crisp white space with deep teal and amber.',
        mood: 'Clean',
        radius: 6,
        colors: {
            background: '#F7FAFB',
            surface: '#FFFFFF',
            primary: '#0E7490',
            accent: '#F59E0B',
            text: '#12303A',
            muted: '#7A939D',
            border: '#DCE8EC',
        },
    },
    {
        id: 'sunset',
        name: 'Sunset Bazaar',
        tagline: 'Amber heat and coral light for loud drops.',
        mood: 'Bold',
        radius: 14,
        colors: {
            background: '#FFF8F0',
            surface: '#FFFFFF',
            primary: '#F97316',
            accent: '#E11D48',
            text: '#3B1E08',
            muted: '#A88C76',
            border: '#F6E3D2',
        },
    },
    {
        id: 'lavender',
        name: 'Lavender Studio',
        tagline: 'Soft lilac over cool slate blue.',
        mood: 'Calm',
        radius: 12,
        colors: {
            background: '#F8F7FC',
            surface: '#FFFFFF',
            primary: '#8B7BD8',
            accent: '#4C6FFF',
            text: '#241F3D',
            muted: '#8F8AA8',
            border: '#E6E3F2',
        },
    },
    {
        id: 'mono',
        name: 'Mono Editorial',
        tagline: 'Stark black on white, square and gallery-like.',
        mood: 'Minimal',
        radius: 0,
        colors: {
            background: '#FFFFFF',
            surface: '#FFFFFF',
            primary: '#111111',
            accent: '#6B6B6B',
            text: '#111111',
            muted: '#7A7A7A',
            border: '#E0E0E0',
        },
    },
    {
        id: 'citrus',
        name: 'Citrus Pop',
        tagline: 'Highlighter yellow with a navy anchor.',
        mood: 'Playful',
        radius: 18,
        colors: {
            background: '#FFFDF0',
            surface: '#FFFFFF',
            primary: '#FACC15',
            accent: '#1E3A8A',
            text: '#1B2440',
            muted: '#8A8467',
            border: '#F0E9C8',
        },
    },
    {
        id: 'clay',
        name: 'Terracotta Clay',
        tagline: 'Clay, olive and warm sand for craft goods.',
        mood: 'Earthy',
        radius: 10,
        colors: {
            background: '#FBF5EE',
            surface: '#FFFFFF',
            primary: '#B4552D',
            accent: '#6E7B4F',
            text: '#33231A',
            muted: '#9C8878',
            border: '#EDDCCB',
        },
    },
];

/** Falls back to the storefront's current look if an unknown id is stored. */
export function findWebsiteTheme(id: string): WebsiteTheme {
    return WEBSITE_THEMES.find((theme) => theme.id === id) ?? WEBSITE_THEMES[0];
}