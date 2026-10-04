import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';

/**
 * Full-screen preview for a payment / refund screenshot.
 *
 * Dependency-free and deliberately single-layer — one overlay, no nested
 * modals. The image keeps its own aspect ratio (`object-contain`, never
 * stretched), click or the zoom control scales it up, and Escape or the close
 * button dismisses it.
 */
export default function ScreenshotViewer({
    src,
    alt,
    open,
    onClose,
}: {
    src?: string;
    alt: string;
    open: boolean;
    onClose: () => void;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {/* Mounted only while open, so the zoom level resets on every reopen. */}
            {open && src && <ViewerBody key="screenshot-viewer" src={src} alt={alt} onClose={onClose} />}
        </AnimatePresence>
    );
}

function ViewerBody({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    const [zoomed, setZoomed] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            className="fixed inset-0 z-[120] flex flex-col bg-black/90"
        >
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <p className="truncate text-xs font-semibold text-white/80">{alt}</p>
                <div className="flex shrink-0 items-center gap-2">
                    <IconButton label={zoomed ? 'Zoom out' : 'Zoom in'} onClick={() => setZoomed((current) => !current)}>
                        {zoomed ? <Minus size={16} /> : <Plus size={16} />}
                    </IconButton>
                    <IconButton label="Close preview" onClick={onClose}>
                        <X size={16} />
                    </IconButton>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setZoomed((current) => !current)}
                aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
                className="flex flex-1 cursor-zoom-in items-center justify-center overflow-auto p-4"
            >
                <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    className="select-none rounded-lg bg-white shadow-2xl"
                    style={{
                        width: zoomed ? '170%' : undefined,
                        maxWidth: zoomed ? 'none' : '100%',
                        maxHeight: zoomed ? 'none' : '100%',
                        objectFit: 'contain',
                        transition: 'width 180ms ease',
                    }}
                />
            </button>
        </motion.div>
    );
}

function IconButton({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/15"
        >
            {children}
        </button>
    );
}
