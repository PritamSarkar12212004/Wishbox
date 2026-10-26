import { useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, Plus, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { uploadMediaFile, uploadMediaUrl, type CloudinaryResourceType } from '@/modules/admin/api/mediaUploadApi';
import { AdminButton, TextInput } from './AdminUI';

/**
 * Drag-and-drop media input. Local files and direct media URLs are uploaded to
 * Cloudinary before their delivery URL is saved to the product or settings.
 */

export default function DropZone({
    label,
    hint,
    values,
    onChange,
    multiple = false,
    accept = 'image/*',
    emptyLabel = 'Drag a photo here, or click to browse',
    resourceType = 'image',
    folder = 'products',
    allowUrl = true,
}: {
    label: string;
    hint?: string;
    values: string[];
    onChange: (next: string[]) => void;
    multiple?: boolean;
    accept?: string;
    emptyLabel?: string;
    resourceType?: CloudinaryResourceType;
    folder?: 'products' | 'catalogues' | 'orders' | 'settings';
    allowUrl?: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [url, setUrl] = useState('');
    const [busy, setBusy] = useState(false);

    async function acceptFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        const incoming = [...files];
        setBusy(true);
        const accepted: string[] = [];
        try {
            for (const file of incoming) {
                if (resourceType === 'image' && !file.type.startsWith('image/')) {
                    toast.error(`${file.name} is not an image`);
                    continue;
                }
                if (resourceType === 'video' && !file.type.startsWith('video/')) {
                    toast.error(`${file.name} is not a video`);
                    continue;
                }
                try {
                    accepted.push(await uploadMediaFile(file, resourceType, folder));
                } catch (error) {
                    toast.error(`Could not upload ${file.name}`, {
                        description: error instanceof Error ? error.message : 'Please try again.',
                    });
                }
            }
            if (accepted.length === 0) return;
            onChange(multiple ? [...values, ...accepted] : [accepted[0]!]);
            toast.success(`${accepted.length} ${resourceType === 'video' ? 'video' : 'image'}${accepted.length === 1 ? '' : 's'} uploaded to Cloudinary`);
        } finally {
            setBusy(false);
        }
    }

    async function addUrl() {
        const next = url.trim();
        if (!next) return;
        setBusy(true);
        try {
            const stored = await uploadMediaUrl(next, resourceType, folder);
            onChange(multiple ? [...values, stored] : [stored]);
            setUrl('');
            toast.success('Media saved in Cloudinary');
        } catch (error) {
            toast.error('Could not upload this media URL', {
                description: error instanceof Error ? error.message : 'Use a direct image/video file URL.',
            });
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <div>
                <p className="text-xs font-semibold">{label}</p>
                {hint && (
                    <p className="mt-0.5 text-[11px] leading-snug" style={{ color: Theme.colors.textMuted }}>
                        {hint}
                    </p>
                )}
            </div>

            {values.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                    {values.map((value, index) => (
                        <li key={`${value.slice(0, 24)}-${index}`} className="relative">
                            {resourceType === 'video' ? (
                                <video src={value} className="h-20 w-28 rounded-lg object-cover" controls />
                            ) : (
                                <img src={value} alt="" className="h-20 w-20 rounded-lg object-cover" style={{ border: `1px solid ${Theme.colors.border}` }} />
                            )}
                            <button
                                type="button"
                                onClick={() => onChange(values.filter((_, position) => position !== index))}
                                aria-label={`Remove ${label} ${index + 1}`}
                                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full shadow-sm"
                                style={{ backgroundColor: Theme.colors.text, color: Theme.colors.background }}
                            >
                                <X size={11} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <div
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    void acceptFiles(event.dataTransfer.files);
                }}
                className="rounded-xl border-2 border-dashed p-3 text-center transition-colors"
                style={{
                    borderColor: dragging ? Theme.colors.primaryDark : Theme.colors.borderStrong,
                    backgroundColor: dragging ? Theme.colors.surfaceAlt : Theme.colors.surface,
                }}
            >
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        multiple={multiple}
                        className="hidden"
                        onChange={(event) => {
                            void acceptFiles(event.target.files);
                            event.target.value = '';
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={busy}
                        className="flex w-full flex-col items-center gap-1.5 py-2 text-center"
                    >
                        <span
                            className="grid h-9 w-9 place-items-center rounded-full"
                            style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.primaryDark }}
                        >
                            {busy ? <Loader2 size={16} className="animate-spin" /> : multiple ? <ImagePlus size={16} /> : <UploadCloud size={16} />}
                        </span>
                        <span className="text-xs font-semibold">{emptyLabel}</span>
                        <span className="text-[10.5px]" style={{ color: Theme.colors.textMuted }}>
                            {multiple ? 'Select several at once' : 'Choose a file'} · uploads directly to Cloudinary
                        </span>
                    </button>
            </div>

            {allowUrl && (
                <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                        <Link2
                            size={14}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: Theme.colors.textMuted }}
                        />
                        <TextInput
                            value={url}
                            onChange={(event) => setUrl(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    void addUrl();
                                }
                            }}
                            placeholder={resourceType === 'video' ? 'https://…/video.mp4' : 'https://…/photo.jpg'}
                            className="pl-9 text-xs"
                            aria-label={`${label} URL`}
                        />
                    </div>
                    <AdminButton onClick={() => void addUrl()} disabled={url.trim().length === 0 || busy}>
                        {busy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                        Upload
                    </AdminButton>
                </div>
            )}
        </div>
    );
}
