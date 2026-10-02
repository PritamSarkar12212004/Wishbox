import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { KeyRound, Store } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { AdminButton, Field, TextInput } from '../components/AdminUI';
import adminConst from '../consts/adminConst';
import { adminSessionStore, useAdminSession } from '../store/sessionStore';

export default function SignInPage() {
    const signedIn = useAdminSession();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (signedIn) {
        return <Navigate to={adminConst.route.adminPage} replace />;
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (adminSessionStore.signIn(email, password)) {
            toast.success('Welcome back');
            navigate(adminConst.route.adminPage);
        } else {
            setError(`Those credentials do not match the demo account (${adminConst.demo.email}).`);
        }
    }

    return (
        <div
            className="flex min-h-screen items-center justify-center px-4 py-10"
            style={{ backgroundColor: Theme.colors.background, fontFamily: Theme.Typography.fontFamily }}
        >
            <div className="w-full max-w-sm">
                <div className="text-center">
                    <p
                        className="text-2xl font-bold"
                        style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.primaryDark }}
                    >
                        WishBox
                    </p>
                    <p
                        className="mt-1 text-xs font-semibold uppercase tracking-[0.16em]"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        Admin panel
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 flex flex-col gap-4 rounded-2xl border p-6"
                    style={{
                        backgroundColor: Theme.colors.surface,
                        borderColor: Theme.colors.border,
                        boxShadow: Theme.Shadow.md,
                    }}
                >
                    <Field label="Email">
                        <TextInput
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder={adminConst.demo.email}
                            autoComplete="username"
                            required
                        />
                    </Field>

                    <Field label="Password">
                        <TextInput
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </Field>

                    {error && (
                        <p role="alert" className="text-xs font-medium" style={{ color: Theme.colors.accentDark }}>
                            {error}
                        </p>
                    )}

                    <AdminButton type="submit" variant="primary" className="h-10">
                        <KeyRound size={14} />
                        Sign in
                    </AdminButton>
                </form>

                <div
                    className="mt-4 rounded-xl border border-dashed p-3.5 text-[11.5px] leading-relaxed"
                    style={{
                        borderColor: Theme.colors.borderStrong,
                        backgroundColor: Theme.colors.surfaceAlt,
                        color: Theme.colors.textLight,
                    }}
                >
                    <strong style={{ color: Theme.colors.text }}>Demo access</strong> — there is no real
                    authentication. Sign in with <code>{adminConst.demo.email}</code> /{' '}
                    <code>{adminConst.demo.password}</code>. Product and order changes are stored in this
                    browser only.
                </div>

                <Link
                    to="/"
                    className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors hover:opacity-70"
                    style={{ color: Theme.colors.textLight }}
                >
                    <Store size={13} />
                    Back to storefront
                </Link>
            </div>
        </div>
    );
}
