import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Catches render-time crashes so a broken page never blanks the whole store. */
class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('Unhandled UI error:', error, info.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div
                className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
                style={{ backgroundColor: Theme.colors.background }}
            >
                <div
                    className="grid h-16 w-16 place-items-center rounded-full"
                    style={{ backgroundColor: Theme.colors.surfaceAlt }}
                >
                    <AlertTriangle size={28} style={{ color: Theme.colors.accent }} />
                </div>
                <h1
                    className="mt-5 text-2xl font-bold"
                    style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
                >
                    Something went wrong
                </h1>
                <p className="mt-2 max-w-md text-sm leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                    An unexpected error interrupted this page. Reloading usually fixes it — your cart and
                    wishlist are saved on this device.
                </p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white transition-transform active:scale-[0.98]"
                    style={{ backgroundColor: Theme.colors.primaryDark }}
                >
                    <RotateCcw size={15} />
                    Reload the page
                </button>
            </div>
        );
    }
}

export default ErrorBoundary;
