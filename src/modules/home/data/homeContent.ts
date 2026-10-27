/**
 * Home page content — the hero every visitor lands on.
 *
 * This mirrors the API's `home` section (the server's `content.types.ts`), which
 * the admin edits on Website → Home hero. The defaults below are the shipped
 * hero, so a fresh browser shows exactly what the site always did until the API
 * answers.
 */

export type HomeHero = {
    /** The small pill above the headline. Empty hides it. */
    eyebrow: string;
    /** The headline. Required — a hero without one is an empty page. */
    title: string;
    /** The sentence under the headline. Empty hides it. */
    lead: string;
};

export type HomeContent = {
    hero: HomeHero;
};

/* Ceilings the API also enforces, kept here so a too-long field is caught while
 * typing instead of coming back as a 422 on save. */
export const MAX_HERO_EYEBROW = 60;
export const MAX_HERO_TITLE = 140;
export const MAX_HERO_LEAD = 600;

export const DEFAULT_HOME_CONTENT: HomeContent = {
    hero: {
        eyebrow: 'Handmade in Jaipur',
        title: 'Paper & décor for the moments you want to remember',
        lead: 'Small-batch handmade paper, gift wrap and home décor — pressed, cut and finished by hand, then shipped across India.',
    },
};

/** What the admin has to fix before the hero can be saved. */
export function homeProblems(content: HomeContent): string[] {
    const problems: string[] = [];
    const { eyebrow, title, lead } = content.hero;

    if (!title.trim()) {
        problems.push('Give the hero a headline — it is the first thing a visitor reads.');
    }
    if (title.trim().length > MAX_HERO_TITLE) {
        problems.push(`Headline: keep it to ${MAX_HERO_TITLE} characters or fewer.`);
    }
    if (eyebrow.trim().length > MAX_HERO_EYEBROW) {
        problems.push(`Eyebrow: keep it to ${MAX_HERO_EYEBROW} characters or fewer.`);
    }
    if (lead.trim().length > MAX_HERO_LEAD) {
        problems.push(`Description: keep it to ${MAX_HERO_LEAD} characters or fewer.`);
    }

    return problems;
}
