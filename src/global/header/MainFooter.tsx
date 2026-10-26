import ActionButton from '@/components/ui/action-button';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowUp, Check, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import InstagramIcon from '@/components/icons/InstagramIcon';
import { isValidDestination, normalizeDestination, phoneHref } from '@/global/site/footerContent';
import { useFooterContent } from '@/global/site/footerStore';

/**
 * Validates a WhatsApp number and returns a human-readable error, or `null`
 * when the number can be subscribed.
 */
function validateWhatsapp(value: string): string | null {
    const digits = value.replace(/\D/g, '');
    if (!digits) return 'Enter your WhatsApp number to subscribe';
    if (digits.length < 10) {
        const missing = 10 - digits.length;
        return `Add ${missing} more digit${missing > 1 ? 's' : ''} — mobile numbers are 10 digits long`;
    }
    if (!/^[6-9]/.test(digits)) return 'Indian mobile numbers start with 6, 7, 8 or 9';
    if (/^(\d)\1{9}$/.test(digits)) return 'Enter a real mobile number, not a repeating digit';
    return null;
}

const MainFooter = () => {
    /* Footer copy and links come from the admin's Website tab — see footerStore. */
    const content = useFooterContent();
    /* Only rows that would render something real; a bare `shop` is normalised
     * to `/shop` first, so an admin's half-typed path never becomes a dead link. */
    const usable = (link: { label: string; to: string }) =>
        Boolean(link.label.trim()) && isValidDestination(normalizeDestination(link.to));
    const shopLinks = content.shopLinks.filter(usable);
    const companyLinks = content.companyLinks.filter(usable);
    const [whatsapp, setWhatsapp] = useState('');
    const [error, setError] = useState<string | null>(null);
    /** Errors stay hidden until the field is touched or submitted. */
    const [touched, setTouched] = useState(false);
    const [subscribed, setSubscribed] = useState<string | null>(null);

    const digits = whatsapp.replace(/\D/g, '');
    const invalid = Boolean(error);

    function handleChange(raw: string) {
        setWhatsapp(raw.replace(/\D/g, '').slice(0, 10));
        setSubscribed(null);
        // Live re-validate only after the first blur/submit so we never nag mid-typing.
        setError(touched ? validateWhatsapp(raw) : null);
    }

    function handleBlur() {
        setTouched(true);
        setError(validateWhatsapp(whatsapp));
    }

    function subscribeWhatsApp() {
        const message = validateWhatsapp(whatsapp);
        setTouched(true);
        setError(message);
        if (message) {
            toast.error(message);
            return;
        }
        setSubscribed(digits);
        toast.success(`Offers & updates will arrive on +91 ${digits} via WhatsApp`);
        setWhatsapp('');
        setTouched(false);
        setError(null);
    }

    return (
        <footer
            id="site-footer"
            style={{
                backgroundColor: Theme.colors.surface,
                borderTop: `1px solid ${Theme.colors.border}`,
                color: Theme.colors.textLight,
                fontFamily: Theme.Typography.fontFamily,
                // Exposed so class-based hover states can reach the theme accent.
                ['--f-accent' as string]: Theme.colors.accentDark,
            } as React.CSSProperties}
            className="w-full"
        >
            {/* ── Main columns ──────────────────────────────────── */}
            <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
                    {/* Brand */}
                    <div className="lg:col-span-4">
                        <Link
                            to="/"
                            className="inline-block text-2xl"
                            style={{
                                fontFamily: Theme.Typography.headingFamily,
                                color: Theme.colors.primaryDark,
                                letterSpacing: '0.5px',
                            }}
                        >
                            {content.storeName}
                        </Link>
                        <p className="mt-3 max-w-sm text-sm leading-relaxed">{content.tagline}</p>

                        <div className="mt-5 flex items-center gap-2.5">
                            {content.instagramUrl.trim() && (
                                <a
                                    href={normalizeDestination(content.instagramUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Instagram"
                                    className="grid h-10 w-10 place-items-center rounded-full transition-all duration-200 hover:-translate-y-0.5"
                                    style={{
                                        backgroundColor: Theme.colors.surfaceAlt,
                                        border: `1px solid ${Theme.colors.border}`,
                                    }}
                                >
                                    <InstagramIcon size={18} color={Theme.colors.accentDark} />
                                </a>
                            )}
                            {content.whatsappUrl.trim() && (
                                <a
                                    href={normalizeDestination(content.whatsappUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="WhatsApp"
                                    className="grid h-10 w-10 place-items-center rounded-full transition-all duration-200 hover:-translate-y-0.5"
                                    style={{
                                        backgroundColor: Theme.colors.surfaceAlt,
                                        border: `1px solid ${Theme.colors.border}`,
                                    }}
                                >
                                    <MessageCircle size={18} style={{ color: '#25D366' }} />
                                </a>
                            )}
                            {content.email.trim() && (
                                <a
                                    href={`mailto:${content.email.trim()}`}
                                    aria-label="Email us"
                                    className="grid h-10 w-10 place-items-center rounded-full transition-all duration-200 hover:-translate-y-0.5"
                                    style={{
                                        backgroundColor: Theme.colors.surfaceAlt,
                                        border: `1px solid ${Theme.colors.border}`,
                                    }}
                                >
                                    <Mail size={18} style={{ color: Theme.colors.primary }} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Shop links */}
                    {shopLinks.length > 0 && (
                        <nav className="lg:col-span-2" aria-label="Shop">
                            <h3
                                className="text-xs font-bold uppercase tracking-[0.14em]"
                                style={{ color: Theme.colors.text }}
                            >
                                {content.shopHeading || 'Shop'}
                            </h3>
                            <ul className="mt-4 space-y-2.5 text-sm">
                                {shopLinks.map((link) => (
                                    <li key={link.id}>
                                        <Link
                                            to={normalizeDestination(link.to)}
                                            className="transition-colors hover:text-[color:var(--f-accent)]"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}

                    {/* Company links */}
                    {companyLinks.length > 0 && (
                        <nav className="lg:col-span-2" aria-label="Company">
                            <h3
                                className="text-xs font-bold uppercase tracking-[0.14em]"
                                style={{ color: Theme.colors.text }}
                            >
                                {content.companyHeading || 'Company'}
                            </h3>
                            <ul className="mt-4 space-y-2.5 text-sm">
                                {companyLinks.map((link) => (
                                    <li key={link.id}>
                                        <Link
                                            to={normalizeDestination(link.to)}
                                            className="transition-colors hover:text-[color:var(--f-accent)]"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}

                    {/* Contact + WhatsApp subscribe */}
                    <div className="lg:col-span-4">
                        <h3
                            className="text-xs font-bold uppercase tracking-[0.14em]"
                            style={{ color: Theme.colors.text }}
                        >
                            {content.contactHeading || 'Get in touch'}
                        </h3>
                        <ul className="mt-4 space-y-2.5 text-sm">
                            {content.address.trim() && (
                                <li className="flex items-center gap-2.5">
                                    <MapPin size={15} style={{ color: Theme.colors.primary }} />
                                    <span>{content.address}</span>
                                </li>
                            )}
                            {phoneHref(content.phone) && (
                                <li className="flex items-center gap-2.5">
                                    <Phone size={15} style={{ color: Theme.colors.primary }} />
                                    <a
                                        href={phoneHref(content.phone)}
                                        className="hover:text-[color:var(--f-accent)]"
                                    >
                                        {content.phone}
                                    </a>
                                </li>
                            )}
                            {content.email.trim() && (
                                <li className="flex items-center gap-2.5">
                                    <Mail size={15} style={{ color: Theme.colors.primary }} />
                                    <a
                                        href={`mailto:${content.email.trim()}`}
                                        className="hover:text-[color:var(--f-accent)]"
                                    >
                                        {content.email}
                                    </a>
                                </li>
                            )}
                        </ul>

                        <div
                            className="mt-5 rounded-2xl border p-3.5"
                            style={{
                                borderColor: Theme.colors.border,
                                backgroundColor: Theme.colors.surfaceAlt,
                            }}
                        >
                            <p className="text-xs font-semibold" style={{ color: Theme.colors.text }}>
                                {content.subscribeHeading || 'Offers & drops on WhatsApp'}
                            </p>
                            <form
                                className="mt-2.5"
                                noValidate
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    subscribeWhatsApp();
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="relative min-w-0 flex-1">
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            autoComplete="tel-national"
                                            maxLength={10}
                                            value={whatsapp}
                                            onChange={(e) => handleChange(e.target.value)}
                                            onBlur={handleBlur}
                                            placeholder="10-digit number"
                                            aria-label="Your WhatsApp number"
                                            aria-invalid={invalid}
                                            aria-describedby="footer-whatsapp-status"
                                            className="w-full rounded-full py-2 pl-3.5 pr-12 text-sm tabular-nums outline-none transition-colors placeholder:opacity-70"
                                            style={{
                                                backgroundColor: Theme.colors.surface,
                                                border: `1px solid ${
                                                    invalid
                                                        ? Theme.colors.accentDark
                                                        : Theme.colors.border
                                                }`,
                                                color: Theme.colors.text,
                                                boxShadow: invalid
                                                    ? `0 0 0 3px color-mix(in srgb, ${Theme.colors.accentDark} 15%, transparent)`
                                                    : 'none',
                                            }}
                                        />
                                        {digits.length > 0 && !invalid && (
                                            <span
                                                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold tabular-nums"
                                                style={{ color: Theme.colors.textMuted }}
                                            >
                                                {digits.length}/10
                                            </span>
                                        )}
                                        {invalid && (
                                            <AlertCircle
                                                size={14}
                                                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                                                style={{ color: Theme.colors.accentDark }}
                                            />
                                        )}
                                    </div>
                                    <ActionButton
                                        type="submit"
                                        aria-label="Subscribe via WhatsApp"
                                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform duration-200 hover:scale-105 active:scale-95"
                                        style={{ backgroundColor: '#25D366', color: Theme.colors.white }}
                                    >
                                        <MessageCircle size={16} />
                                    </ActionButton>
                                </div>

                                {/* Reserves its line so validation never shifts the layout. */}
                                <p
                                    id="footer-whatsapp-status"
                                    aria-live="polite"
                                    className="mt-2 flex min-h-[15px] items-start gap-1.5 text-[11px] leading-tight"
                                    style={{
                                        color: invalid
                                            ? Theme.colors.accentDark
                                            : Theme.colors.primaryDark,
                                    }}
                                >
                                    {invalid && (
                                        <>
                                            <AlertCircle size={12} className="mt-px shrink-0" />
                                            <span>{error}</span>
                                        </>
                                    )}
                                    {!invalid && subscribed && (
                                        <>
                                            <Check size={12} className="mt-px shrink-0" />
                                            <span>Subscribed — offers will land on +91 {subscribed}</span>
                                        </>
                                    )}
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom bar ────────────────────────────────────── */}
            <div
                className="border-t"
                style={{ backgroundColor: Theme.colors.surfaceAlt, borderColor: Theme.colors.border }}
            >
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs sm:flex-row md:px-8">
                    {content.copyright.trim() && (
                        <p style={{ color: Theme.colors.textMuted }}>{content.copyright}</p>
                    )}
                    <div className="flex items-center gap-5">
                        <Link
                            to="/contact"
                            className="transition-colors hover:text-[color:var(--f-accent)]"
                        >
                            Help &amp; support
                        </Link>
                        <ActionButton
                            type="button"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="flex items-center gap-1.5 font-semibold transition-colors hover:text-[color:var(--f-accent)]"
                            style={{ color: Theme.colors.text }}
                        >
                            <ArrowUp size={13} />
                            Back to top
                        </ActionButton>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default MainFooter;
