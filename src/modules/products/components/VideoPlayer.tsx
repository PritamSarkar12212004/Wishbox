import { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertTriangle,
    Loader2,
    Maximize,
    Minimize,
    Pause,
    Play,
    RotateCcw,
    RotateCw,
    Volume1,
    Volume2,
    VolumeX,
    X,
} from 'lucide-react';
import Theme from '@/assets/Theme/Theme';

/** Order the speed button cycles through. */
const PLAYBACK_RATES = [1, 1.25, 1.5, 2, 0.5];

const SKIP_SECONDS = 5;

function formatTime(value: number) {
    if (!Number.isFinite(value) || value < 0) return '0:00';
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

type VideoPlayerProps = {
    src?: string;
    poster?: string;
    title?: string;
    onClose?: () => void;
};

function ControlButton({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/90 transition-all duration-200 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95"
        >
            {children}
        </button>
    );
}

const VideoPlayer = ({ src, poster, title, onClose }: VideoPlayerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hideTimer = useRef<number | null>(null);

    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [rate, setRate] = useState(1);
    const [buffering, setBuffering] = useState(true);
    const [failed, setFailed] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [scrubbing, setScrubbing] = useState(false);

    const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
    const bufferedRatio = duration > 0 ? Math.min(1, buffered / duration) : 0;
    const showControls = controlsVisible || !playing || scrubbing;

    /** Keep the chrome visible for a moment, then fade it out while playing. */
    const keepControlsVisible = useCallback(() => {
        setControlsVisible(true);
        if (hideTimer.current) window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => setControlsVisible(false), 2600);
    }, []);

    useEffect(() => {
        return () => {
            if (hideTimer.current) window.clearTimeout(hideTimer.current);
        };
    }, []);

    useEffect(() => {
        const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) void video.play().catch(() => setFailed(true));
        else video.pause();
    }, []);

    /** Paused means the chrome stays on screen; playing re-arms the auto-hide. */
    const handlePause = useCallback(() => {
        setPlaying(false);
        if (hideTimer.current) window.clearTimeout(hideTimer.current);
        setControlsVisible(true);
    }, []);

    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setMuted(video.muted);
    }, []);

    const applyVolume = useCallback((next: number) => {
        const video = videoRef.current;
        const value = Math.min(1, Math.max(0, Number(next.toFixed(2))));
        setVolume(value);
        if (video) {
            video.volume = value;
            video.muted = value === 0;
        }
        setMuted(value === 0);
    }, []);

    const cycleRate = useCallback(() => {
        const next = PLAYBACK_RATES[(PLAYBACK_RATES.indexOf(rate) + 1) % PLAYBACK_RATES.length];
        setRate(next);
        if (videoRef.current) videoRef.current.playbackRate = next;
    }, [rate]);

    const toggleFullscreen = useCallback(() => {
        const element = containerRef.current;
        if (!element) return;
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
        else void element.requestFullscreen?.().catch(() => undefined);
    }, []);

    const seekToClientX = useCallback((clientX: number, element: HTMLElement) => {
        const video = videoRef.current;
        if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
        const rect = element.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        video.currentTime = ratio * video.duration;
        setCurrentTime(video.currentTime);
    }, []);

    const skip = useCallback((delta: number) => {
        const video = videoRef.current;
        if (!video || !Number.isFinite(video.duration)) return;
        video.currentTime = Math.min(video.duration, Math.max(0, video.currentTime + delta));
    }, []);

    function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        switch (event.key) {
            case ' ':
            case 'k':
                event.preventDefault();
                togglePlay();
                break;
            case 'ArrowRight':
                event.preventDefault();
                skip(SKIP_SECONDS);
                break;
            case 'ArrowLeft':
                event.preventDefault();
                skip(-SKIP_SECONDS);
                break;
            case 'ArrowUp':
                event.preventDefault();
                applyVolume(volume + 0.1);
                break;
            case 'ArrowDown':
                event.preventDefault();
                applyVolume(volume - 0.1);
                break;
            case 'm':
                event.preventDefault();
                toggleMute();
                break;
            case 'f':
                event.preventDefault();
                toggleFullscreen();
                break;
            case 'Escape':
                if (!document.fullscreenElement) onClose?.();
                break;
            default:
                break;
        }
    }

    return (
        <div
            ref={containerRef}
            role="region"
            aria-label={title ? `Video player — ${title}` : 'Video player'}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onMouseMove={keepControlsVisible}
            onTouchStart={keepControlsVisible}
            className="relative h-full w-full overflow-hidden bg-black outline-none"
            style={{ borderRadius: 'inherit' }}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="h-full w-full cursor-pointer object-contain"
                autoPlay
                playsInline
                preload="metadata"
                onClick={togglePlay}
                onPlay={() => {
                    setPlaying(true);
                    keepControlsVisible();
                }}
                onPause={handlePause}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onLoadedMetadata={(event) => {
                    setDuration(event.currentTarget.duration || 0);
                    setBuffering(false);
                }}
                onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
                onProgress={(event) => {
                    const video = event.currentTarget;
                    if (video.buffered.length > 0) {
                        setBuffered(video.buffered.end(video.buffered.length - 1));
                    }
                }}
                onWaiting={() => setBuffering(true)}
                onPlaying={() => setBuffering(false)}
                onCanPlay={() => setBuffering(false)}
                onEnded={() => {
                    handlePause();
                    onClose?.();
                }}
                onError={() => {
                    setFailed(true);
                    setBuffering(false);
                }}
            />

            {/* Buffering spinner */}
            {buffering && !failed && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <Loader2 size={34} className="animate-spin text-white/85" />
                </div>
            )}

            {/* Error state */}
            {failed && (
                <div className="absolute inset-0 grid place-items-center bg-black/85 px-6 text-center">
                    <div className="flex flex-col items-center">
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white">
                            <AlertTriangle size={22} />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-white">Video unavailable</p>
                        <p className="mt-1 text-xs text-white/70">
                            We couldn&apos;t load this video. Please try again later.
                        </p>
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-4 rounded-full px-4 py-2 text-xs font-semibold transition-transform hover:-translate-y-0.5"
                                style={{ backgroundColor: Theme.colors.surface, color: Theme.colors.text }}
                            >
                                Back to photos
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Center play button — visible whenever paused */}
            {!playing && !failed && (
                <button
                    type="button"
                    aria-label="Play video"
                    onClick={togglePlay}
                    className={`absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-black/65 ${
                        showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
                    }`}
                >
                    <Play size={26} fill="currentColor" className="ml-0.5" />
                </button>
            )}

            {/* Top bar: title + close */}
            <div
                className={`absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent px-3 pb-8 pt-3 transition-opacity duration-300 sm:px-4 ${
                    showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
            >
                <p className="truncate text-xs font-medium text-white/90 sm:text-sm">
                    {title ?? 'Product video'}
                </p>
                {onClose && (
                    <button
                        type="button"
                        aria-label="Close video"
                        onClick={onClose}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white transition-all duration-200 hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95"
                    >
                        <X size={17} />
                    </button>
                )}
            </div>

            {/* Bottom controls */}
            <div
                className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pb-3 pt-10 transition-opacity duration-300 sm:px-4 sm:pb-4 ${
                    showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
            >
                {/* Seek bar */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="w-9 shrink-0 text-right text-[11px] font-medium tabular-nums text-white/85 sm:w-10 sm:text-xs">
                        {formatTime(currentTime)}
                    </span>

                    <div
                        role="slider"
                        aria-label="Seek"
                        aria-valuemin={0}
                        aria-valuemax={Math.floor(duration)}
                        aria-valuenow={Math.floor(currentTime)}
                        tabIndex={0}
                        onPointerDown={(event) => {
                            setScrubbing(true);
                            event.currentTarget.setPointerCapture(event.pointerId);
                            seekToClientX(event.clientX, event.currentTarget);
                        }}
                        onPointerMove={(event) => {
                            if (scrubbing) seekToClientX(event.clientX, event.currentTarget);
                        }}
                        onPointerUp={(event) => {
                            setScrubbing(false);
                            event.currentTarget.releasePointerCapture(event.pointerId);
                        }}
                        onPointerCancel={() => setScrubbing(false)}
                        onKeyDown={(event) => {
                            if (event.key === 'ArrowRight') skip(SKIP_SECONDS);
                            if (event.key === 'ArrowLeft') skip(-SKIP_SECONDS);
                        }}
                        className="group/seek relative h-4 flex-1 cursor-pointer touch-none focus-visible:outline-none"
                    >
                        <span
                            className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full"
                            style={{ backgroundColor: 'rgba(255,255,255,0.28)' }}
                        >
                            <span
                                className="absolute inset-y-0 left-0 rounded-full bg-white/35"
                                style={{ width: `${bufferedRatio * 100}%` }}
                            />
                        </span>
                        <span
                            className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full transition-[width] duration-100"
                            style={{ width: `${progress * 100}%`, backgroundColor: Theme.colors.accent }}
                        />
                        <span
                            className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md transition-opacity duration-200 ${
                                scrubbing ? 'opacity-100' : 'opacity-0 group-hover/seek:opacity-100'
                            }`}
                            style={{ left: `${progress * 100}%` }}
                        />
                    </div>

                    <span className="w-9 shrink-0 text-[11px] font-medium tabular-nums text-white/85 sm:w-10 sm:text-xs">
                        {formatTime(duration)}
                    </span>
                </div>

                {/* Control row */}
                <div className="mt-1.5 flex items-center gap-0.5 sm:gap-1">
                    <ControlButton label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>
                        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    </ControlButton>

                    <ControlButton label={`Rewind ${SKIP_SECONDS} seconds`} onClick={() => skip(-SKIP_SECONDS)}>
                        <RotateCcw size={16} />
                    </ControlButton>

                    <ControlButton label={`Forward ${SKIP_SECONDS} seconds`} onClick={() => skip(SKIP_SECONDS)}>
                        <RotateCw size={16} />
                    </ControlButton>

                    <ControlButton label={muted ? 'Unmute' : 'Mute'} onClick={toggleMute}>
                        {muted || volume === 0 ? (
                            <VolumeX size={17} />
                        ) : volume < 0.5 ? (
                            <Volume1 size={17} />
                        ) : (
                            <Volume2 size={17} />
                        )}
                    </ControlButton>

                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={muted ? 0 : volume}
                        onChange={(event) => applyVolume(Number(event.target.value))}
                        aria-label="Volume"
                        className="hidden h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/30 outline-none md:block"
                        style={{ accentColor: Theme.colors.accent }}
                    />

                    <span className="ml-auto flex items-center gap-0.5 sm:gap-1">
                        <button
                            type="button"
                            onClick={cycleRate}
                            aria-label={`Playback speed ${rate}x`}
                            title="Playback speed"
                            className="h-9 rounded-full px-2.5 text-[11px] font-semibold tabular-nums text-white/90 transition-all duration-200 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:text-xs"
                        >
                            {rate}×
                        </button>

                        <ControlButton
                            label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                            onClick={toggleFullscreen}
                        >
                            {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
                        </ControlButton>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
