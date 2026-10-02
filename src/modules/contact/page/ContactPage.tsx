import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCheck,
  Clock,
  Copy,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { cn } from '@/lib/utils';
import InstagramIcon from '@/components/icons/InstagramIcon';
import SelectMenu from '@/components/ui/select-menu';
import {
  CONTACT_FAQS,
  CONTACT_TOPICS,
  EMAIL,
  PHONE,
  SOCIALS,
  STUDIO,
  SUPPORT_HOURS,
  WHATSAPP,
} from '../data/contactData';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const WHATSAPP_GREEN = '#25D366';
const MESSAGE_LIMIT = 600;

const themeVars = {
  '--c-surface-alt': Theme.colors.surfaceAlt,
  '--c-accent-dark': Theme.colors.accentDark,
  '--c-primary-dark': Theme.colors.primaryDark,
} as React.CSSProperties;

const inputStyle = (invalid: boolean): React.CSSProperties => ({
  backgroundColor: Theme.colors.surface,
  border: `1px solid ${invalid ? Theme.colors.accentDark : Theme.colors.border}`,
  color: Theme.colors.text,
  boxShadow: invalid
    ? `0 0 0 3px color-mix(in srgb, ${Theme.colors.accentDark} 14%, transparent)`
    : 'none',
});

const INPUT_CLASS =
  'w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:opacity-60 focus:border-[color:var(--c-accent-dark)]';

/* ------------------------------------------------------------------ */
/*  Form model                                                         */
/* ------------------------------------------------------------------ */

type FormValues = {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  consent: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  name: '',
  email: '',
  phone: '',
  topic: CONTACT_TOPICS[0].value,
  message: '',
  consent: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) errors.name = 'Please tell us your name';
  else if (values.name.trim().length < 2) errors.name = 'That name looks a little short';

  if (!values.email.trim()) errors.email = 'We need an email address to reply';
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'That email address looks incomplete';

  // Optional, but if given it has to be a real reachable number.
  if (values.phone.trim()) {
    const digits = values.phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      errors.phone = `WhatsApp numbers are 10 digits — you typed ${digits.length}`;
    } else if (!/^[6-9]/.test(digits)) {
      errors.phone = 'Indian mobile numbers start with 6, 7, 8 or 9';
    }
  }

  if (!values.message.trim()) errors.message = 'Tell us a little about your question';
  else if (values.message.trim().length < 10) {
    errors.message = 'Add a few more words so we can answer properly';
  }

  if (!values.consent) errors.consent = 'Please allow us to contact you back';

  return errors;
}

/* ------------------------------------------------------------------ */
/*  Micro components                                                   */
/* ------------------------------------------------------------------ */

function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: Theme.colors.textMuted }}
        >
          {label}
          {required && <span style={{ color: Theme.colors.accent }}> *</span>}
        </label>
        {hint}
      </div>
      <div className="mt-1.5">{children}</div>
      {/* Height is reserved so validation never shifts the layout. */}
      <p
        id={`${id}-error`}
        aria-live="polite"
        className="mt-1.5 flex min-h-[15px] items-start gap-1.5 text-[11px] leading-tight"
        style={{ color: Theme.colors.accentDark }}
      >
        {error && (
          <>
            <AlertCircle size={12} className="mt-px shrink-0" />
            <span>{error}</span>
          </>
        )}
      </p>
    </div>
  );
}

function Pill({
  icon: Icon,
  children,
}: {
  icon: typeof Clock;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11.5px] font-medium backdrop-blur-sm sm:text-xs"
      style={{
        borderColor: Theme.colors.border,
        backgroundColor: 'color-mix(in srgb, #FFFFFF 70%, transparent)',
        color: Theme.colors.textLight,
      }}
    >
      <Icon size={13} style={{ color: Theme.colors.primaryDark }} />
      {children}
    </span>
  );
}

/** One of the two hero channels (WhatsApp / email). */
function ChannelCard({
  accent,
  icon: Icon,
  iconColor,
  kicker,
  value,
  bestFor,
  meta,
  primaryLabel,
  primaryHref,
  external,
  onCopy,
  copyLabel,
}: {
  accent: string;
  icon: typeof Mail;
  iconColor: string;
  kicker: string;
  value: string;
  bestFor: string;
  meta: string;
  primaryLabel: string;
  primaryHref: string;
  external?: boolean;
  onCopy: () => void;
  copyLabel: string;
}) {
  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-3xl border p-5 transition-transform duration-300 hover:-translate-y-1 sm:p-6"
      style={{
        borderColor: Theme.colors.border,
        background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 14%, ${Theme.colors.surface}) 0%, ${Theme.colors.surface} 62%)`,
        boxShadow: Theme.Shadow.sm,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-60 transition-opacity duration-300 group-hover:opacity-90"
        style={{ background: `radial-gradient(circle, ${accent}44, transparent 70%)` }}
      />

      <div className="relative flex items-center gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
          style={{ backgroundColor: iconColor, color: Theme.colors.white }}
        >
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: Theme.colors.textMuted }}
          >
            {kicker}
          </p>
          <p
            className="truncate text-lg font-bold tabular-nums sm:text-xl"
            style={{ color: Theme.colors.text }}
            title={value}
          >
            {value}
          </p>
        </div>
      </div>

      <p className="relative mt-4 text-[13px] leading-relaxed" style={{ color: Theme.colors.textLight }}>
        {bestFor}
      </p>
      <p
        className="relative mt-1.5 inline-flex items-center gap-1.5 text-[11.5px]"
        style={{ color: Theme.colors.textMuted }}
      >
        <Clock size={12} />
        {meta}
      </p>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <a
          href={primaryHref}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-semibold transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
          style={{ backgroundColor: iconColor, color: Theme.colors.white, boxShadow: Theme.Shadow.sm }}
        >
          {primaryLabel}
          <ArrowRight size={14} />
        </a>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-[12.5px] font-semibold transition-colors hover:bg-[var(--c-surface-alt)]"
          style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
        >
          <Copy size={14} />
          <span className="hidden sm:inline">{copyLabel}</span>
        </button>
      </div>
    </article>
  );
}

function RailCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Clock;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-4 sm:p-5"
      style={{
        borderColor: Theme.colors.border,
        backgroundColor: Theme.colors.surface,
        boxShadow: Theme.Shadow.sm,
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
          style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.primaryDark }}
        >
          <Icon size={15} />
        </span>
        <h3
          className="text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ color: Theme.colors.text }}
        >
          {title}
        </h3>
      </div>
      <div className="mt-3 text-[13px] leading-relaxed" style={{ color: Theme.colors.textLight }}>
        {children}
      </div>
    </section>
  );
}

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border transition-colors"
      style={{
        borderColor: open ? Theme.colors.borderStrong : Theme.colors.border,
        backgroundColor: Theme.colors.surface,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[var(--c-surface-alt)] sm:px-5 sm:py-4"
      >
        <span className="text-[13.5px] font-semibold sm:text-sm" style={{ color: Theme.colors.text }}>
          {question}
        </span>
        <span
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full transition-transform duration-200"
          style={{
            backgroundColor: open ? Theme.colors.primaryDark : Theme.colors.surfaceAlt,
            color: open ? Theme.colors.white : Theme.colors.textMuted,
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {open && (
        <p
          className="border-t px-4 pb-4 pt-3 text-[12.5px] leading-relaxed sm:px-5 sm:pb-5 sm:text-[13px]"
          style={{ borderColor: Theme.colors.border, color: Theme.colors.textMuted }}
        >
          {answer}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Contact form                                                       */
/* ------------------------------------------------------------------ */

type SendStatus = 'idle' | 'sending' | 'sent';

function ContactForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [status, setStatus] = useState<SendStatus>('idle');
  const [receipt, setReceipt] = useState<{ email: string; topic: string; phone: string } | null>(null);

  const fieldRefs = useRef<Partial<Record<keyof FormValues, HTMLElement | null>>>({});
  const topicLabel =
    CONTACT_TOPICS.find((topic) => topic.value === values.topic)?.label ?? CONTACT_TOPICS[0].label;

  const filledErrors = useMemo(
    () => Object.keys(errors).filter((key) => Boolean(errors[key as keyof FormValues])),
    [errors]
  );

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    const next = { ...values, [key]: value };
    setValues(next);
    // Live re-validate only after the field was touched, so we never nag mid-typing.
    if (touched[key]) {
      const nextErrors = validate(next);
      setErrors((prev) => ({ ...prev, [key]: nextErrors[key] }));
    }
  }

  function handleBlur(key: keyof FormValues) {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const nextErrors = validate(values);
    setErrors((prev) => ({ ...prev, [key]: nextErrors[key] }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setTouched({ name: true, email: true, phone: true, message: true, consent: true });

    const firstInvalid = (['name', 'email', 'phone', 'message', 'consent'] as const).find(
      (key) => nextErrors[key]
    );
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus();
      toast.error(nextErrors[firstInvalid] as string);
      return;
    }

    setStatus('sending');
    const digits = values.phone.replace(/\D/g, '');
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setReceipt({ email: values.email.trim(), topic: topicLabel, phone: digits });
    setStatus('sent');
    toast.success('Message sent — we will get back to you shortly');
  }

  function reset() {
    setValues(EMPTY_FORM);
    setErrors({});
    setTouched({});
    setReceipt(null);
    setStatus('idle');
  }

  if (status === 'sent' && receipt) {
    return (
      <div
        className="rounded-3xl border p-6 text-center sm:p-9"
        style={{
          borderColor: Theme.colors.primaryLight,
          backgroundColor: Theme.Alert.Success.background,
          boxShadow: Theme.Shadow.md,
        }}
      >
        <span
          className="mx-auto grid h-14 w-14 place-items-center rounded-full"
          style={{ backgroundColor: Theme.colors.primaryDark, color: Theme.colors.white }}
        >
          <CheckCheck size={24} />
        </span>
        <h2
          className="mt-4 text-xl font-bold sm:text-2xl"
          style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
        >
          Message sent
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: Theme.colors.textLight }}>
          Thanks for reaching out — we reply to <strong style={{ color: Theme.colors.text }}>{receipt.email}</strong> within
          one business day.
          {receipt.phone
            ? ` If you prefer, we can also continue on WhatsApp at +91 ${receipt.phone}.`
            : ' Add a WhatsApp number next time for an instant reply.'}
        </p>

        <div
          className="mx-auto mt-5 max-w-sm rounded-2xl border px-4 py-3 text-left text-[12.5px]"
          style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: Theme.colors.textMuted }}
          >
            Subject
          </span>
          <p className="mt-0.5 font-semibold" style={{ color: Theme.colors.text }}>
            {receipt.topic}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: Theme.colors.primaryDark, color: Theme.colors.white }}
          >
            <Send size={14} />
            Send another message
          </button>
          <Link
            to="/history"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-[13px] font-semibold transition-colors hover:bg-[var(--c-surface-alt)]"
            style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
          >
            Track an order
          </Link>
        </div>
      </div>
    );
  }

  const sending = status === 'sending';

  return (
    <div
      className="rounded-3xl border p-5 sm:p-7"
      style={{
        borderColor: Theme.colors.border,
        backgroundColor: Theme.colors.surface,
        boxShadow: Theme.Shadow.md,
      }}
    >
      <header>
        <h2
          className="text-xl font-bold tracking-tight sm:text-2xl"
          style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
        >
          Send us a message
        </h2>
        <p className="mt-1.5 text-[13px]" style={{ color: Theme.colors.textMuted }}>
          Tell us what you need and we will reply on email — or on WhatsApp if you share your number.
          <span className="ml-1" style={{ color: Theme.colors.textLight }}>
            {filledErrors.length > 0
              ? `${filledErrors.length} field${filledErrors.length > 1 ? 's' : ''} need attention`
              : 'All fields marked * are required.'}
          </span>
        </p>
      </header>

      <form className="mt-5" noValidate onSubmit={handleSubmit}>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field id="name" label="Your name" required error={touched.name ? errors.name : undefined}>
            <input
              id="name"
              ref={(node) => {
                fieldRefs.current.name = node;
              }}
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={(event) => setField('name', event.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Ananya Sharma"
              aria-invalid={Boolean(touched.name && errors.name)}
              aria-describedby="name-error"
              className={INPUT_CLASS}
              style={inputStyle(Boolean(touched.name && errors.name))}
            />
          </Field>

          <Field id="email" label="Email" required error={touched.email ? errors.email : undefined}>
            <input
              id="email"
              ref={(node) => {
                fieldRefs.current.email = node;
              }}
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => setField('email', event.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="you@example.com"
              aria-invalid={Boolean(touched.email && errors.email)}
              aria-describedby="email-error"
              className={INPUT_CLASS}
              style={inputStyle(Boolean(touched.email && errors.email))}
            />
          </Field>

          <Field
            id="phone"
            label="WhatsApp number (optional)"
            hint={
              <span className="text-[10px] font-medium" style={{ color: Theme.colors.textMuted }}>
                {values.phone.length}/10
              </span>
            }
            error={touched.phone ? errors.phone : undefined}
          >
            <div className="relative">
              <span
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold"
                style={{ color: Theme.colors.textMuted }}
              >
                +91
              </span>
              <input
                id="phone"
                ref={(node) => {
                  fieldRefs.current.phone = node;
                }}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={values.phone}
                onChange={(event) => setField('phone', event.target.value.replace(/\D/g, '').slice(0, 10))}
                onBlur={() => handleBlur('phone')}
                placeholder="98765 43210"
                aria-invalid={Boolean(touched.phone && errors.phone)}
                aria-describedby="phone-error"
                className={cn(INPUT_CLASS, 'pl-12 tabular-nums')}
                style={inputStyle(Boolean(touched.phone && errors.phone))}
              />
            </div>
          </Field>

          <Field id="topic" label="What is this about?">
            <SelectMenu
              id="topic"
              variant="field"
              label="What is this about?"
              menuHeading="Our inbox"
              value={values.topic}
              options={CONTACT_TOPICS}
              onChange={(next) => setField('topic', next)}
            />
          </Field>
        </div>

        <Field
          id="message"
          label="Message"
          required
          hint={
            <span
              className="text-[10px] font-medium tabular-nums"
              style={{
                color:
                  values.message.length > MESSAGE_LIMIT * 0.9
                    ? Theme.colors.accentDark
                    : Theme.colors.textMuted,
              }}
            >
              {values.message.length}/{MESSAGE_LIMIT}
            </span>
          }
          error={touched.message ? errors.message : undefined}
        >
          <textarea
            id="message"
            ref={(node) => {
              fieldRefs.current.message = node;
            }}
            rows={5}
            value={values.message}
            onChange={(event) => setField('message', event.target.value.slice(0, MESSAGE_LIMIT))}
            onBlur={() => handleBlur('message')}
            placeholder="I am planning a wedding in November and need around 200 handmade invite sheets — which GSM do you suggest?"
            aria-invalid={Boolean(touched.message && errors.message)}
            aria-describedby="message-error"
            className={cn(INPUT_CLASS, 'resize-none leading-relaxed')}
            style={inputStyle(Boolean(touched.message && errors.message))}
          />
        </Field>

        <div className="mt-1">
          <label
            htmlFor="consent"
            className="flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-snug"
            style={{ color: Theme.colors.textLight }}
          >
            <input
              id="consent"
              ref={(node) => {
                fieldRefs.current.consent = node;
              }}
              type="checkbox"
              checked={values.consent}
              onChange={(event) => setField('consent', event.target.checked)}
              onBlur={() => handleBlur('consent')}
              aria-invalid={Boolean(touched.consent && errors.consent)}
              aria-describedby="consent-error"
              className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[color:var(--c-primary-dark)]"
              style={{ outlineColor: Theme.colors.border }}
            />
            Yes, WishBox can contact me about this enquiry.
          </label>
          <p
            id="consent-error"
            aria-live="polite"
            className="mt-1.5 flex min-h-[15px] items-start gap-1.5 text-[11px]"
            style={{ color: Theme.colors.accentDark }}
          >
            {touched.consent && errors.consent && (
              <>
                <AlertCircle size={12} className="mt-px shrink-0" />
                <span>{errors.consent}</span>
              </>
            )}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0"
            style={{
              background: `linear-gradient(135deg, ${Theme.colors.accent}, ${Theme.colors.accentDark})`,
              boxShadow: Theme.Shadow.md,
            }}
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {sending ? 'Sending…' : 'Send message'}
          </button>

          <p className="text-[11.5px]" style={{ color: Theme.colors.textMuted }}>
            Need it faster?{' '}
            <a
              href={`https://wa.me/${WHATSAPP.waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold"
              style={{ color: Theme.colors.primaryDark }}
            >
              WhatsApp us
            </a>{' '}
            or check your{' '}
            <Link to="/history" className="font-semibold" style={{ color: Theme.colors.primaryDark }}>
              order history
            </Link>
            .
          </p>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  async function copyValue(value: string, label: string) {
    // Clipboard API needs a secure context; fall back to the legacy path so
    // copying still works in embedded or non-HTTPS previews.
    const legacyCopy = () => {
      const holder = document.createElement('textarea');
      holder.value = value;
      holder.setAttribute('readonly', '');
      holder.style.position = 'fixed';
      holder.style.opacity = '0';
      document.body.appendChild(holder);
      holder.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(holder);
      return ok;
    };

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
      return;
    } catch {
      try {
        if (legacyCopy()) {
          toast.success(`${label} copied`);
          return;
        }
      } catch {
        // fall through to the manual message
      }
      toast.error('Copy failed — please select it manually');
    }
  }

  return (
    <div className="min-h-full w-full" style={{ ...themeVars, backgroundColor: Theme.colors.background }}>
      {/* ── Hero + primary channels ── */}
      <section
        className="relative overflow-hidden border-b"
        style={{
          borderColor: Theme.colors.border,
          background: `linear-gradient(140deg, ${Theme.colors.surfaceAlt} 0%, ${Theme.colors.surface} 48%, color-mix(in srgb, ${Theme.colors.primaryLight} 30%, ${Theme.colors.surface}) 100%)`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full"
          style={{ background: `radial-gradient(circle, color-mix(in srgb, ${Theme.colors.primaryLight} 55%, transparent), transparent 70%)` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-16 h-80 w-80 rounded-full"
          style={{ background: `radial-gradient(circle, color-mix(in srgb, ${Theme.colors.accent} 26%, transparent), transparent 70%)` }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14 md:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{
                borderColor: Theme.colors.border,
                backgroundColor: 'color-mix(in srgb, #FFFFFF 75%, transparent)',
                color: Theme.colors.primaryDark,
              }}
            >
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ backgroundColor: WHATSAPP_GREEN }}
              />
              WishBox support
            </span>

            <h1
              className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
            >
              Let&apos;s talk — we are a message away
            </h1>
            <p
              className="mt-3 max-w-2xl text-[14px] leading-relaxed sm:text-base"
              style={{ color: Theme.colors.textLight }}
            >
              Questions about an order, a custom size, bulk pricing or your next DIY project — pick
              whichever channel suits you. A real human from the studio reads every message.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <Pill icon={MessageCircle}>WhatsApp · usually a couple of hours</Pill>
              <Pill icon={Mail}>Email · within one business day</Pill>
              <Pill icon={MapPin}>Based in Jaipur, India</Pill>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:gap-6">
            <ChannelCard
              accent={WHATSAPP_GREEN}
              icon={MessageCircle}
              iconColor={WHATSAPP_GREEN}
              kicker="WhatsApp us"
              value={WHATSAPP.display}
              bestFor={WHATSAPP.bestFor}
              meta="Mon–Sat · 10:00 AM – 7:00 PM IST"
              primaryLabel="Start chat"
              primaryHref={`https://wa.me/${WHATSAPP.waNumber}?text=${encodeURIComponent(WHATSAPP.prefill)}`}
              external
              copyLabel="Copy number"
              onCopy={() => copyValue(WHATSAPP.display, 'WhatsApp number')}
            />

            <ChannelCard
              accent={Theme.colors.primary}
              icon={Mail}
              iconColor={Theme.colors.primaryDark}
              kicker="Email us"
              value={EMAIL.display}
              bestFor={EMAIL.bestFor}
              meta="Replies within one business day"
              primaryLabel="Send an email"
              primaryHref={`mailto:${EMAIL.display}?subject=${encodeURIComponent('WishBox enquiry')}`}
              copyLabel="Copy address"
              onCopy={() => copyValue(EMAIL.display, 'Email address')}
            />
          </div>
        </div>
      </section>

      {/* ── Form + studio details ── */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8 lg:py-14">
        {/* Two columns from tablet up: form on the right, studio details on the left. */}
        <div className="grid gap-6 md:grid-cols-12 md:gap-6 lg:gap-8">
          {/* Form first in the DOM so it leads on mobile. */}
          <div className="md:order-2 md:col-span-7 xl:col-span-8">
            <ContactForm />
          </div>

          <aside className="flex flex-col gap-4 md:order-1 md:col-span-5 md:sticky md:top-24 md:self-start lg:top-28 xl:col-span-4">
            <RailCard icon={Phone} title="Call us">
              <a
                href={`tel:${PHONE.tel}`}
                className="text-base font-bold tabular-nums transition-colors hover:text-[var(--c-accent-dark)]"
                style={{ color: Theme.colors.text }}
              >
                {PHONE.display}
              </a>
              <p className="mt-1 text-[12px]" style={{ color: Theme.colors.textMuted }}>
                Quickest for order updates and delivery questions.
              </p>
            </RailCard>

            <RailCard icon={MapPin} title="Visit the studio">
              {STUDIO.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <a
                href={STUDIO.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors hover:text-[var(--c-accent-dark)]"
                style={{ color: Theme.colors.primaryDark }}
              >
                Get directions
                <ArrowRight size={13} />
              </a>
            </RailCard>

            <RailCard icon={Clock} title="Support hours">
              <dl className="divide-y" style={{ borderColor: Theme.colors.border }}>
                {SUPPORT_HOURS.map((slot) => (
                  <div
                    key={slot.days}
                    className="flex items-center justify-between gap-3 border-t py-2 first:border-t-0 first:pt-0 last:pb-0"
                    style={{ borderColor: Theme.colors.border }}
                  >
                    <dt className="text-[12.5px]">{slot.days}</dt>
                    <dd
                      className="text-[12.5px] font-semibold tabular-nums"
                      style={{
                        color:
                          slot.time === 'Closed' ? Theme.colors.textMuted : Theme.colors.text,
                      }}
                    >
                      {slot.time}
                    </dd>
                  </div>
                ))}
              </dl>
            </RailCard>

            <RailCard icon={MessageCircle} title="Follow along">
              <p>New drops, studio notes and behind-the-scenes reels.</p>
              <div className="mt-3 flex items-center gap-2.5">
                <a
                  href={SOCIALS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="grid h-10 w-10 place-items-center rounded-full border transition-all duration-200 hover:-translate-y-0.5"
                  style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceAlt }}
                >
                  <InstagramIcon size={17} color={Theme.colors.accentDark} />
                </a>
                <a
                  href={SOCIALS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="grid h-10 w-10 place-items-center rounded-full border transition-all duration-200 hover:-translate-y-0.5"
                  style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceAlt }}
                >
                  <MessageCircle size={17} style={{ color: WHATSAPP_GREEN }} />
                </a>
                <a
                  href={SOCIALS.email}
                  aria-label="Email us"
                  className="grid h-10 w-10 place-items-center rounded-full border transition-all duration-200 hover:-translate-y-0.5"
                  style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceAlt }}
                >
                  <Mail size={17} style={{ color: Theme.colors.primary }} />
                </a>
              </div>
            </RailCard>
          </aside>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section
        className="border-t"
        style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceAlt }}
      >
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 lg:px-8 lg:py-14">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: Theme.colors.primaryDark }}
          >
            Before you write
          </p>
          <h2
            className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
          >
            Quick answers
          </h2>

          <div className="mt-6 flex flex-col gap-3">
            {CONTACT_FAQS.map((faq, index) => (
              <FaqItem
                key={faq.q}
                question={faq.q}
                answer={faq.a}
                open={openFaq === index}
                onToggle={() => setOpenFaq(openFaq === index ? null : index)}
              />
            ))}
          </div>

          <p className="mt-6 text-center text-[12.5px]" style={{ color: Theme.colors.textMuted }}>
            Still unsure? Message us on WhatsApp at{' '}
            <a
              href={`https://wa.me/${WHATSAPP.waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold"
              style={{ color: Theme.colors.primaryDark }}
            >
              {WHATSAPP.display}
            </a>{' '}
            or email{' '}
            <a
              href={`mailto:${EMAIL.display}`}
              className="font-semibold"
              style={{ color: Theme.colors.primaryDark }}
            >
              {EMAIL.display}
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
