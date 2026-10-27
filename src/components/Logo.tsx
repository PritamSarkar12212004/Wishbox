import { useState } from 'react';
import { Link } from 'react-router-dom';
import Theme from '@/assets/Theme/Theme';

/**
 * Reusable, optimized WishBox logo.
 *
 * - Uses the WebP source for small file size + quality.
 * - `loading="eager"` keeps it render-blocking for above-the-fold use (header).
 * - `decoding="async"` offloads image decode off the main thread.
 * - Explicit width/height prevent Cumulative Layout Shift (CLS).
 * - Falls back to a text mark if the image ever fails to load.
 */
interface LogoProps {
    /** Width in pixels (also sets height proportionally). Default fits the header. */
    width?: number;
    height?: number;
    /** Whether to show the "WishBox" wordmark next to the icon. */
    withText?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export function Logo({
    width = 36,
    height = 36,
    withText = true,
    className = '',
    style,
}: LogoProps) {
    const [loaded, setLoaded] = useState(false);

    return (
        <Link to="/" className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
            <span className="relative inline-block shrink-0" style={{ ...style, width, height }}>
                <img
                    src="/maindp.webp"
                    alt="WishBox logo"
                    width={width}
                    height={height}
                    loading="eager"
                    decoding="async"
                    className={`block shrink-0 rounded-lg ${className}`}
                    onLoad={() => setLoaded(true)}
                    onError={() => setLoaded(false)}
                    style={{
                        objectFit: 'contain',
                        width,
                        height,
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 0.2s ease',
                    }}
                />
                {!loaded && (
                    <div
                        className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted"
                        style={{ width, height, fontSize: width * 0.35, fontWeight: 700 }}
                    >
                        WB
                    </div>
                )}
            </span>
            {withText && loaded && (
                <span
                    className="font-bold tracking-tight"
                    style={{
                        fontFamily: Theme.Typography.headingFamily,
                        fontSize: '1.25rem',
                        color: Theme.colors.primaryDark,
                        letterSpacing: '0.5px',
                    }}
                >
                    WishBox
                </span>
            )}
        </Link>
    );
}
