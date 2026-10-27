import { useMemo, useState } from 'react';
import { Globe, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import {
    AdminButton,
    Field,
    PageHeader,
    Panel,
    PanelHeader,
    TextArea,
    TextInput,
} from '../components/AdminUI';
import {
    MAX_HERO_EYEBROW,
    MAX_HERO_LEAD,
    MAX_HERO_TITLE,
    homeProblems,
    type HomeContent,
} from '@/modules/home/data/homeContent';
import { useHomeContent } from '@/modules/home/store/homeStore';
import { useUpdateSiteContent } from '@/modules/site/api/useSiteContent';
import { ApiError } from '@/lib/api/client';

/**
 * Website → Home hero — the copy at the top of the home page.
 *
 * Saved to the API (`PATCH /admin/content`), which is what every visitor's hero
 * renders. The response hydrates the shared store, so the storefront shows the
 * new headline the moment Save returns, on every browser.
 */
export default function HeroContentPage() {
    const saved = useHomeContent();
    const [draft, setDraft] = useState<HomeContent>(saved);
    const updateContent = useUpdateSiteContent();

    const problems = useMemo(() => homeProblems(draft), [draft]);
    const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

    const patch = (values: Partial<HomeContent['hero']>) =>
        setDraft((current) => ({ ...current, hero: { ...current.hero, ...values } }));

    async function save() {
        if (problems.length > 0) return;

        /* Same key order as the stored shape, so the draft compares equal to the
         * saved content and Save turns itself off after writing. */
        const next: HomeContent = {
            hero: {
                eyebrow: draft.hero.eyebrow.trim(),
                title: draft.hero.title.trim(),
                lead: draft.hero.lead.trim(),
            },
        };

        try {
            const result = await updateContent.mutateAsync({ home: next });
            // What the API stored, not what was sent: the server is the authority.
            setDraft(result.home);
            toast.success('Home hero saved', {
                description: 'The storefront headline now reads this, for every visitor.',
            });
        } catch (error) {
            toast.error(error instanceof ApiError ? error.message : 'Could not save the home hero');
        }
    }

    async function reset() {
        try {
            const result = await updateContent.mutateAsync({ reset: ['home'] });
            setDraft(result.home);
            toast('Home hero reset to the shipped copy');
        } catch (error) {
            toast.error(error instanceof ApiError ? error.message : 'Could not reset the home hero');
        }
    }

    return (
        <div>
            <PageHeader
                title="Home hero"
                description="The top of the home page — saved on the server, so every visitor sees it."
            >
                <AdminButton onClick={() => window.open('/', '_blank', 'noopener')}>
                    <Globe size={13} />
                    View storefront
                </AdminButton>
                <AdminButton disabled={updateContent.isPending} onClick={() => void reset()}>
                    <RotateCcw size={13} />
                    Reset
                </AdminButton>
                <AdminButton
                    variant="primary"
                    disabled={!dirty || problems.length > 0 || updateContent.isPending}
                    onClick={() => void save()}
                >
                    <Save size={13} />
                    Save hero
                </AdminButton>
            </PageHeader>

            {problems.length > 0 && (
                <Panel className="mb-6">
                    <PanelHeader
                        title="Fix these before saving"
                        meta="The hero never renders a half-typed headline."
                    />
                    <ul className="flex flex-col gap-1.5 px-4 py-3 text-xs sm:px-5">
                        {problems.map((problem) => (
                            <li key={problem} className="flex items-start gap-2">
                                <span
                                    aria-hidden="true"
                                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: Theme.colors.accentDark }}
                                />
                                <span style={{ color: Theme.colors.text }}>{problem}</span>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Panel>
                    <PanelHeader
                        title="Headline"
                        meta="Shown in the pill and the large line"
                    />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field
                            label="Eyebrow"
                            hint={`The small pill above the headline — up to ${MAX_HERO_EYEBROW} characters. Leave it empty to hide the pill.`}
                        >
                            <TextInput
                                maxLength={MAX_HERO_EYEBROW}
                                placeholder="Handmade in Jaipur"
                                value={draft.hero.eyebrow}
                                onChange={(event) => patch({ eyebrow: event.target.value })}
                            />
                        </Field>
                        <Field
                            label="Headline"
                            hint={`Required — up to ${MAX_HERO_TITLE} characters.`}
                        >
                            <TextArea
                                rows={2}
                                maxLength={MAX_HERO_TITLE}
                                placeholder="Paper & décor for the moments you want to remember"
                                value={draft.hero.title}
                                onChange={(event) => patch({ title: event.target.value })}
                            />
                        </Field>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader
                        title="Description"
                        meta="The sentence under the headline"
                    />
                    <div className="px-4 py-4 sm:px-5">
                        <Field
                            label="Description"
                            hint={`Up to ${MAX_HERO_LEAD} characters. Leave it empty to show the headline on its own.`}
                        >
                            <TextArea
                                rows={5}
                                maxLength={MAX_HERO_LEAD}
                                placeholder="Small-batch handmade paper, gift wrap and home décor — pressed, cut and finished by hand, then shipped across India."
                                value={draft.hero.lead}
                                onChange={(event) => patch({ lead: event.target.value })}
                            />
                        </Field>
                    </div>
                </Panel>
            </div>

            <Panel className="mt-6">
                <PanelHeader title="Preview" meta="How the hero reads on the home page" />
                <div
                    className="flex flex-col items-center gap-3 px-4 py-8 text-center sm:px-5"
                    style={{ backgroundColor: Theme.colors.surfaceAlt }}
                >
                    {draft.hero.eyebrow.trim() && (
                        <span
                            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                            style={{
                                backgroundColor: Theme.colors.surface,
                                color: Theme.colors.primaryDark,
                            }}
                        >
                            {draft.hero.eyebrow}
                        </span>
                    )}
                    <p
                        className="max-w-2xl text-xl font-bold leading-tight sm:text-2xl"
                        style={{
                            fontFamily: Theme.Typography.headingFamily,
                            color: Theme.colors.text,
                        }}
                    >
                        {draft.hero.title.trim() || 'Your headline appears here'}
                    </p>
                    {draft.hero.lead.trim() && (
                        <p
                            className="max-w-xl text-xs leading-relaxed sm:text-sm"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            {draft.hero.lead}
                        </p>
                    )}
                </div>
                <div
                    className="border-t px-4 py-3 sm:px-5"
                    style={{ borderColor: Theme.colors.border }}
                >
                    <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                        The hero's “Shop the collection” button is part of the page layout, not this copy:
                        it always points at the shop. Saving writes to the content the whole storefront
                        reads, so the change is live for every visitor without a deploy.
                    </p>
                </div>
            </Panel>
        </div>
    );
}
