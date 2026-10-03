import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { ArrowLeft, BadgeCheck, Check, Loader2, MessageCircle, ShieldCheck, X } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { AUTH_COPY } from '../data/authData';
import {
    OTP_LENGTH,
    RESEND_SECONDS,
    countdownLabel,
    formatPhone,
    generateOtp,
    isCompleteOtp,
    isValidName,
    isValidPhone,
    maskPhone,
    normalizePhone,
    splitOtp,
} from '../lib/otp';
import { authStore } from '../store/authStore';
import { loginGate, useLoginGate } from '../store/loginGate';

type Stage = 'details' | 'verify' | 'done';

const fieldClass =
    'h-12 w-full rounded-xl border px-3.5 text-[15px] outline-none transition-shadow focus:ring-2 focus:ring-black/10';

const fieldStyle: React.CSSProperties = {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    color: Theme.colors.text,
};

/**
 * Account gate modal: name + WhatsApp number, then a 6-digit code.
 *
 * Rendered once at app level. It reads the login gate, so any action that calls
 * `requireLogin` opens it and continues after verification. Phones get a
 * bottom sheet, larger screens a centred card.
 */
export default function LoginModal() {
    const { open, reason, session } = useLoginGate();

    return (
        <DialogPrimitive.Root
            open={open}
            onOpenChange={(next) => {
                if (!next) loginGate.close();
            }}
        >
            <DialogPrimitive.Portal>
                <DialogPrimitive.Backdrop
                    data-slot="login-backdrop"
                    className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
                />
                <DialogPrimitive.Popup
                    data-slot="login-popup"
                    className="fixed z-[61] w-full outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-3xl max-sm:data-open:slide-in-from-bottom-6 sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,27rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:data-open:zoom-in-95
                    max-h-[92vh] overflow-y-auto overscroll-contain"
                    style={{
                        backgroundColor: Theme.colors.surface,
                        boxShadow: Theme.Shadow.xl,
                        fontFamily: Theme.Typography.fontFamily,
                        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
                    }}
                >
                    {/* A session key restarts the flow cleanly every time the gate opens. */}
                    <LoginFlow key={session} reason={reason} />
                </DialogPrimitive.Popup>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

function LoginFlow({ reason }: { reason?: string }) {
    const [stage, setStage] = useState<Stage>('details');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [digits, setDigits] = useState<string[]>(() => Array.from({ length: OTP_LENGTH }, () => ''));
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [shaking, setShaking] = useState(false);

    const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
    const nameRef = useRef<HTMLInputElement>(null);

    const verify = useCallback(() => {
        setVerifying(true);
        setError('');
        // A short beat stands in for the network round-trip.
        window.setTimeout(() => {
            if (digits.join('') === code) {
                authStore.signIn(name, normalizePhone(phone));
                setStage('done');
                window.setTimeout(() => loginGate.complete(), 1150);
            } else {
                setVerifying(false);
                setDigits(Array.from({ length: OTP_LENGTH }, () => ''));
                setShaking(true);
                setError("That code doesn't match. Check the digits, or resend a new one.");
                otpRefs.current[0]?.focus();
                window.setTimeout(() => setShaking(false), 500);
            }
        }, 620);
    }, [code, digits, name, phone]);

    /* Resend countdown, one tick at a time. */
    useEffect(() => {
        if (cooldown <= 0) return;
        const tick = window.setTimeout(() => setCooldown(cooldown - 1), 1000);
        return () => window.clearTimeout(tick);
    }, [cooldown]);

    /* The moment all six boxes are filled, verify without another tap. */
    useEffect(() => {
        if (stage !== 'verify' || verifying || !isCompleteOtp(digits)) return;
        const id = window.setTimeout(verify, 200);
        return () => window.clearTimeout(id);
    }, [digits, stage, verifying, verify]);

    useEffect(() => {
        if (stage === 'verify') otpRefs.current[0]?.focus();
    }, [stage]);

    function sendCode() {
        if (!isValidName(name)) {
            setError('Please tell us your name — it goes on the invoice.');
            nameRef.current?.focus();
            return;
        }
        if (!isValidPhone(phone)) {
            setError('Enter a valid 10-digit WhatsApp number starting with 6, 7, 8 or 9.');
            return;
        }

        setError('');
        setSending(true);
        window.setTimeout(() => {
            setCode(generateOtp());
            setDigits(Array.from({ length: OTP_LENGTH }, () => ''));
            setStage('verify');
            setCooldown(RESEND_SECONDS);
            setSending(false);
        }, 650);
    }

    function resend() {
        setCode(generateOtp());
        setDigits(Array.from({ length: OTP_LENGTH }, () => ''));
        setError('');
        setNotice('A fresh code is on its way on WhatsApp.');
        setCooldown(RESEND_SECONDS);
        otpRefs.current[0]?.focus();
    }

    function setDigit(index: number, raw: string) {
        const char = raw.replace(/\D/g, '').slice(-1);
        setDigits((current) => current.map((digit, position) => (position === index ? char : digit)));
        setError('');
        if (char && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
    }

    function handleOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Backspace' && !digits[index] && index > 0) {
            event.preventDefault();
            setDigits((current) => current.map((digit, position) => (position === index - 1 ? '' : digit)));
            otpRefs.current[index - 1]?.focus();
            return;
        }
        if (event.key === 'ArrowLeft' && index > 0) {
            event.preventDefault();
            otpRefs.current[index - 1]?.focus();
        }
        if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
            event.preventDefault();
            otpRefs.current[index + 1]?.focus();
        }
    }

    function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
        const pasted = splitOtp(event.clipboardData.getData('text'));
        if (!pasted.some(Boolean)) return;
        event.preventDefault();
        setDigits(pasted);
        setError('');
        const lastFilled = Math.max(0, pasted.filter(Boolean).length - 1);
        otpRefs.current[lastFilled]?.focus();
    }

    const displayPhone = (() => {
        const digitsOnly = normalizePhone(phone);
        return digitsOnly.length > 5 ? `${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}` : digitsOnly;
    })();

    const firstName = name.trim().split(' ')[0] || 'there';

    return (
        <div className="flex flex-col">
            {/* ── Brand strip ─────────────────────────────────────── */}
            <div
                className="relative shrink-0 overflow-hidden px-6 pt-6"
                style={{ background: `linear-gradient(135deg, ${Theme.colors.surfaceAlt}, ${Theme.colors.surface})` }}
            >
                <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2">
                        <span
                            className="grid h-9 w-9 place-items-center rounded-full"
                            style={{ backgroundColor: Theme.colors.primaryDark, color: Theme.colors.white }}
                        >
                            <MessageCircle size={17} />
                        </span>
                        <span
                            className="text-lg font-bold tracking-tight"
                            style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.primaryDark }}
                        >
                            WishBox
                        </span>
                    </span>

                    <DialogPrimitive.Close
                        aria-label="Close sign in"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors hover:bg-black/5"
                        style={{ borderColor: Theme.colors.border, color: Theme.colors.textLight }}
                    >
                        <X size={16} />
                    </DialogPrimitive.Close>
                </div>

                {reason && (
                    <p
                        className="mt-4 inline-flex items-start gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                        style={{ backgroundColor: Theme.colors.surface, color: Theme.colors.text }}
                    >
                        <BadgeCheck size={14} style={{ color: Theme.colors.primaryDark, marginTop: 1 }} />
                        {reason}
                    </p>
                )}

                {/* Step rail */}
                <div className="mt-4 flex items-center gap-2 pb-5" aria-hidden="true">
                    {(['details', 'verify'] as const).map((value, index) => {
                        const order = stage === 'details' ? 0 : 1;
                        const reached = index <= order;
                        return (
                            <span
                                key={value}
                                className="h-1.5 flex-1 rounded-full transition-colors"
                                style={{
                                    backgroundColor: reached ? Theme.colors.primaryDark : Theme.colors.border,
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* ── Steps ───────────────────────────────────────────── */}
            <div className="px-6 pt-5">
                {stage === 'details' && (
                    <form
                        className="flex flex-col gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            sendCode();
                        }}
                    >
                        <header>
                            <DialogPrimitive.Title className="text-xl font-bold tracking-tight">
                                {AUTH_COPY.stepOneTitle}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description
                                className="mt-1 text-[13px] leading-relaxed"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                {AUTH_COPY.stepOneHint}
                            </DialogPrimitive.Description>
                        </header>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold">{AUTH_COPY.nameLabel}</span>
                            <input
                                ref={nameRef}
                                autoFocus
                                value={name}
                                onChange={(event) => {
                                    setName(event.target.value);
                                    setError('');
                                }}
                                placeholder={AUTH_COPY.namePlaceholder}
                                autoComplete="name"
                                maxLength={60}
                                className={fieldClass}
                                style={{
                                    ...fieldStyle,
                                    borderColor: error && !isValidName(name) ? Theme.colors.accentDark : Theme.colors.border,
                                }}
                            />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold">{AUTH_COPY.phoneLabel}</span>
                            <span
                                className="flex h-12 items-center gap-2 rounded-xl border px-3.5"
                                style={{
                                    ...fieldStyle,
                                    borderColor:
                                        error && isValidName(name) && !isValidPhone(phone)
                                            ? Theme.colors.accentDark
                                            : Theme.colors.border,
                                }}
                            >
                                <span
                                    className="flex items-center gap-1.5 pr-2.5 text-sm font-semibold"
                                    style={{ color: Theme.colors.textLight, borderRight: `1px solid ${Theme.colors.border}` }}
                                >
                                    🇮🇳 +91
                                </span>
                                <input
                                    value={displayPhone}
                                    onChange={(event) => {
                                        setPhone(normalizePhone(event.target.value));
                                        setError('');
                                    }}
                                    placeholder="98765 43210"
                                    inputMode="numeric"
                                    autoComplete="tel-national"
                                    maxLength={11}
                                    aria-label="WhatsApp number, 10 digits"
                                    className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none"
                                    style={{ color: Theme.colors.text }}
                                />
                            </span>
                        </label>

                        {error && (
                            <p role="alert" className="text-[12px] font-semibold" style={{ color: Theme.colors.accentDark }}>
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={sending}
                            className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-wait disabled:opacity-80"
                            style={{
                                background: `linear-gradient(135deg, ${Theme.colors.accent} 0%, ${Theme.colors.accentLight} 45%, ${Theme.colors.accentDark} 100%)`,
                                color: Theme.colors.background,
                                boxShadow: Theme.Shadow.md,
                            }}
                        >
                            {sending ? <Loader2 size={17} className="animate-spin" /> : <MessageCircle size={17} />}
                            {sending ? 'Sending…' : AUTH_COPY.sendCode}
                        </button>

                        <p
                            className="flex items-start gap-2 text-[11px] leading-relaxed"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            <ShieldCheck size={13} style={{ marginTop: 2, flexShrink: 0 }} />
                            {AUTH_COPY.trust}
                        </p>
                    </form>
                )}

                {stage === 'verify' && (
                    <div className="flex flex-col gap-4">
                        <header>
                            <DialogPrimitive.Title className="text-xl font-bold tracking-tight">
                                {AUTH_COPY.stepTwoTitle}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description
                                className="mt-1 text-[13px] leading-relaxed"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                {AUTH_COPY.stepTwoHint} Sent to{' '}
                                <span className="font-semibold" style={{ color: Theme.colors.text }}>
                                    {maskPhone(phone)}
                                </span>
                            </DialogPrimitive.Description>
                        </header>

                        <div
                            className={`flex items-center justify-between gap-2 ${shaking ? 'animate-[shake_0.45s_ease-in-out]' : ''}`}
                            role="group"
                            aria-label={`${OTP_LENGTH}-digit verification code`}
                        >
                            {digits.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(node) => {
                                        otpRefs.current[index] = node;
                                    }}
                                    value={digit}
                                    onChange={(event) => setDigit(index, event.target.value)}
                                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                                    onPaste={handlePaste}
                                    onFocus={(event) => event.target.select()}
                                    inputMode="numeric"
                                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                                    maxLength={1}
                                    aria-label={`Digit ${index + 1}`}
                                    aria-invalid={Boolean(error)}
                                    className="h-14 w-full min-w-0 rounded-xl border text-center text-xl font-bold tabular-nums outline-none transition-all focus:ring-2 focus:ring-black/10"
                                    style={{
                                        backgroundColor: digit ? Theme.colors.surfaceAlt : Theme.colors.surface,
                                        borderColor: error ? Theme.colors.accentDark : digit ? Theme.colors.borderStrong : Theme.colors.border,
                                        color: Theme.colors.text,
                                    }}
                                />
                            ))}
                        </div>

                        <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: Theme.colors.surfaceAlt }}>
                            <button
                                type="button"
                                onClick={() => setDigits(splitOtp(code))}
                                className="text-left text-[11px] leading-relaxed"
                                style={{ color: Theme.colors.textLight }}
                            >
                                {AUTH_COPY.demoNote}{' '}
                                <span className="font-bold tabular-nums" style={{ color: Theme.colors.primaryDark }}>
                                    {code.split('').join(' ')}
                                </span>{' '}
                                — tap to fill
                            </button>
                        </div>

                        {error && (
                            <p role="alert" className="text-[12px] font-semibold" style={{ color: Theme.colors.accentDark }}>
                                {error}
                            </p>
                        )}
                        {!error && notice && (
                            <p className="text-[12px] font-medium" style={{ color: Theme.colors.primaryDark }}>
                                {notice}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={verify}
                            disabled={verifying || !isCompleteOtp(digits)}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                            style={{
                                background: `linear-gradient(135deg, ${Theme.colors.accent} 0%, ${Theme.colors.accentLight} 45%, ${Theme.colors.accentDark} 100%)`,
                                color: Theme.colors.background,
                                boxShadow: Theme.Shadow.md,
                            }}
                        >
                            {verifying && <Loader2 size={17} className="animate-spin" />}
                            {verifying ? AUTH_COPY.verifying : AUTH_COPY.verify}
                        </button>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-[12px]">
                            <button
                                type="button"
                                onClick={() => {
                                    setStage('details');
                                    setError('');
                                    setNotice('');
                                }}
                                className="inline-flex items-center gap-1.5 font-semibold transition-colors hover:opacity-70"
                                style={{ color: Theme.colors.textLight }}
                            >
                                <ArrowLeft size={13} />
                                {AUTH_COPY.changeNumber}
                            </button>

                            {cooldown > 0 ? (
                                <span style={{ color: Theme.colors.textMuted }}>
                                    Resend in <span className="font-semibold tabular-nums">{countdownLabel(cooldown)}</span>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={resend}
                                    className="font-semibold underline-offset-2 transition-colors hover:underline"
                                    style={{ color: Theme.colors.accentDark }}
                                >
                                    {AUTH_COPY.resend}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {stage === 'done' && (
                    <div className="flex flex-col items-center gap-3 pb-2 pt-4 text-center">
                        <span
                            className="grid h-14 w-14 place-items-center rounded-full"
                            style={{ backgroundColor: Theme.colors.primaryLight, color: Theme.colors.primaryDark }}
                        >
                            <Check size={26} strokeWidth={3} />
                        </span>
                        <DialogPrimitive.Title className="text-lg font-bold tracking-tight">
                            You're in, {firstName}!
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Description className="text-[13px]" style={{ color: Theme.colors.textMuted }}>
                            {formatPhone(phone)} is verified. Continuing where you left off…
                        </DialogPrimitive.Description>
                    </div>
                )}
            </div>
        </div>
    );
}
