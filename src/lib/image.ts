/**
 * Product imagery is hot-linked, so a blocked, offline or dead URL must never
 * leave a broken image in the storefront.
 *
 * One capture-phase error listener covers every <img> on the page — including
 * nodes created by swiper and PhotoSwipe — and swaps failures for a local SVG
 * placeholder. `data-fallback-applied` guarantees a failed placeholder can
 * never loop.
 */

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750"><rect width="600" height="750" fill="#F5EFE6"/><rect x="0.5" y="0.5" width="599" height="749" fill="none" stroke="#E8E0D8"/><text x="300" y="375" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, 'Times New Roman', serif" font-size="30" fill="#9A8D85">WishBox</text></svg>`;

export const FALLBACK_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PLACEHOLDER_SVG)}`;

export function installImageFallback(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener(
        'error',
        (event) => {
            const target = event.target;
            if (!(target instanceof HTMLImageElement)) return;
            if (target.dataset.fallbackApplied === 'true') return;
            target.dataset.fallbackApplied = 'true';
            target.src = FALLBACK_IMAGE;
        },
        true
    );
}
