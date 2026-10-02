import { useRef, useState } from 'react';
import { ImagePlus, Link2, Plus, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { AdminButton, TextInput } from './AdminUI';

/**
 * Drag-and-drop media input.
 *
 * There is no backend, so dropped files are read into data URLs and stored in
 * localStorage with the catalogue. That budget is small (a few MB per origin),
 * so oversized files are rejected with a nudge towards a hosted URL instead.
 * Video zones are URL-only for the same reason — a video data URL would fill
 * storage on its own.
 */

function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('read-failed'));
        reader.readAsDataURL(file);
    });
}

export default function DropZone({
    label,
    hint,
    values,
    onChange,
    multiple = false,
    maxKb = 300,
    filesAllowed = true,
    accept = 'image/*',
    emptyLabel = 'Drag a photo here, or click to browse',
}: {
    label: string;
    hint?: string;
    values: string[];
    onChange: (next: string[]) => void;
    multiple?: boolean;
    maxKb?: number;
    filesAllowed?: boolean;
    accept?: string;
    emptyLabel?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [url, setUrl] = useState('');

    async function acceptFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        const incoming = [...files];
        const accepted: string[] = [];

        for (const file of incoming) {
            if (file.size > maxKb * 1024) {
                toast.error(`${file.name} is too large`, {
                    description: `Keep images under ${maxKb} KB, or host the file and paste its URL. In-browser storage is limited.`,
                });
                continue;
            }
            try {
                accepted.push(await readAsDataUrl(file));
            } catch {
                toast.error(`Could not read ${file.name}`);
            }
        }

        if (accepted.length === 0) return;
        if (multiple) {
            onChange([...values, ...accepted]);
            toast.success(`${accepted.length} photo${accepted.length === 1 ? '' : 's'} added`);
        } else {
            onChange([accepted[0]]);
        }
    }

    function addUrl() {
        const next = url.trim();
        if (!next) return;
        onChange(multiple ? [...values, next] : [next]);
        setUrl('');
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
                            <img
                                src={value}
                                alt=""
                                className="h-20 w-20 rounded-lg object-cover"
                                style={{ border: `1px solid ${Theme.colors.border}` }}
                            />
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

            {filesAllowed ? (
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
                        className="flex w-full flex-col items-center gap-1.5 py-2 text-center"
                    >
                        <span
                            className="grid h-9 w-9 place-items-center rounded-full"
                            style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.primaryDark }}
                        >
                            {multiple ? <ImagePlus size={16} /> : <UploadCloud size={16} />}
                        </span>
                        <span className="text-xs font-semibold">{emptyLabel}</span>
                        <span className="text-[10.5px]" style={{ color: Theme.colors.textMuted }}>
                            {multiple ? 'Select several at once' : 'One photo'} · under {maxKb} KB
                        </span>
                    </button>
                </div>
            ) : (
                <p className="rounded-lg px-3 py-2 text-[11px]" style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.textLight }}>
                    Paste a hosted video URL — a dropped file cannot be stored in the browser.
                </p>
            )}

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
                                addUrl();
                            }
                        }}
                        placeholder={filesAllowed ? 'https://…/photo.jpg' : 'https://…/promo.mp4'}
                        className="pl-9 text-xs"
                        aria-label={`${label} URL`}
                    />
                </div>
                <AdminButton onClick={addUrl} disabled={url.trim().length === 0}>
                    <Plus size={13} />
                    Add
                </AdminButton>
            </div>
        </div>
    );
}
