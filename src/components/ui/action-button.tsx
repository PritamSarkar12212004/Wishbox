import { useRef, useState, type ComponentProps, type MouseEvent } from 'react';
import { LoaderCircle } from 'lucide-react';
import { queryClient } from '@/lib/api/queryClient';

type ActionButtonProps = ComponentProps<'button'>;

/** A button that reflects async handlers and React Query mutations as loading. */
export default function ActionButton({
    children,
    disabled,
    onClick,
    type,
    ...props
}: ActionButtonProps) {
    const [loading, setLoading] = useState(false);
    const loadingRef = useRef(false);

    function setPending(value: boolean) {
        loadingRef.current = value;
        setLoading(value);
    }

    function watchRequests(baseline: number, waitForStart: boolean) {
        const startedAt = Date.now();
        let observed = false;

        const poll = () => {
            const pending = queryClient.isMutating() + queryClient.isFetching();
            if (pending > baseline) {
                observed = true;
                setPending(true);
            }

            if (observed && pending <= baseline) {
                setPending(false);
                return;
            }

            if (observed || (waitForStart && Date.now() - startedAt < 1_000)) {
                window.setTimeout(poll, 50);
                return;
            }

            setPending(false);
        };

        window.setTimeout(poll, 0);
    }

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
        if (loadingRef.current || disabled) {
            event.preventDefault();
            return;
        }

        const baseline = queryClient.isMutating() + queryClient.isFetching();
        const result: unknown = onClick?.(event);

        if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
            setPending(true);
            void Promise.resolve(result).then(
                () => setPending(false),
                () => setPending(false)
            );
            return;
        }

        // `mutate()` and `refetch()` can both return void from button handlers;
        // observe React Query so these actions still show their own loader.
        if (queryClient.isMutating() + queryClient.isFetching() > baseline) setPending(true);
        watchRequests(baseline, type === 'submit' || type === undefined);
    }

    return (
        <button
            {...props}
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            onClick={handleClick}
        >
            {children}
            {loading && <LoaderCircle size={14} className="ml-1 shrink-0 animate-spin" aria-hidden="true" />}
        </button>
    );
}
