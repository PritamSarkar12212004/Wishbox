import { useRef, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    useRemoveCategoryCatalogue,
    useSetCategoryCatalogue,
} from '@/modules/products/api/useProducts';
import type { ProductCategory } from '@/modules/products/api/productApi';
import { AdminButton, Field, TextArea, TextInput } from './AdminUI';

/** Cloudinary's JSON upload caps the encoded file, so the UI does the same. */
const MAX_PDF_BYTES = 650 * 1024;

/**
 * The official catalogue for one category.
 *
 * A category can carry one designed PDF with the store's own title and blurb.
 * The storefront shows it at the top of that category instead of generating one
 * from the live products, so this is where the "best" catalogue lives.
 *
 * The file is read as a data URI and posted as JSON; the API stores it in
 * Cloudinary and keeps only the URL. A link to an already-hosted PDF is accepted
 * too, which is the way around the size limit.
 */
export default function CategoryCatalogueDialog({
    category,
    open,
    onOpenChange,
}: {
    category: ProductCategory;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const existing = category.catalogue;
    const setCatalogue = useSetCategoryCatalogue();
    const removeCatalogue = useRemoveCategoryCatalogue();
    const fileRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState(existing?.title ?? `${category.label} catalogue`);
    const [description, setDescription] = useState(existing?.description ?? '');
    const [link, setLink] = useState('');
    const [file, setFile] = useState<{ name: string; dataUrl: string } | null>(null);

    const busy = setCatalogue.isPending || removeCatalogue.isPending;

    function chooseFile(selected: File | undefined) {
        if (!selected) {
            setFile(null);
            return;
        }
        if (selected.type !== 'application/pdf') {
            toast.error('Choose a PDF file');
            return;
        }
        if (selected.size > MAX_PDF_BYTES) {
            toast.error('That PDF is too large', {
                description: 'Keep it under 650 KB, or paste a link to the hosted file instead.',
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setFile({ name: selected.name, dataUrl: reader.result });
            }
        };
        reader.onerror = () => toast.error('Could not read that file');
        reader.readAsDataURL(selected);
    }

    function save() {
        const source = file?.dataUrl ?? link.trim() ?? '';
        if (!source && !existing) {
            toast.error('Attach a PDF or paste a link to one');
            return;
        }
        if (title.trim().length < 2) {
            toast.error('Give the catalogue a title');
            return;
        }

        setCatalogue.mutate(
            {
                slug: category.id,
                input: {
                    title: title.trim(),
                    description: description.trim(),
                    file: source || existing!.url,
                },
            },
            {
                onSuccess: () => {
                    toast.success('Catalogue saved', { description: category.label });
                    onOpenChange(false);
                },
                onError: (error) =>
                    toast.error('Could not save the catalogue', {
                        description: error instanceof Error ? error.message : 'Please try again.',
                    }),
            }
        );
    }

    function remove() {
        removeCatalogue.mutate(category.id, {
            onSuccess: () => {
                toast.success('Catalogue removed', { description: category.label });
                setFile(null);
                setLink('');
                onOpenChange(false);
            },
            onError: (error) =>
                toast.error('Could not remove the catalogue', {
                    description: error instanceof Error ? error.message : 'Please try again.',
                }),
        });
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold">
                        {category.label} · catalogue
                    </DialogTitle>
                    <DialogDescription>
                        Shoppers see this on the category page instead of a generated PDF.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <Field label="Title" hint="Shown beside the download button.">
                        <TextInput
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            maxLength={80}
                            placeholder="Spring 2026 catalogue"
                        />
                    </Field>

                    <Field label="Short description" hint="One or two lines. Up to 240 characters.">
                        <TextArea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            maxLength={240}
                            rows={2}
                            placeholder="Everything new this season, in one place."
                        />
                    </Field>

                    <Field label="PDF file" hint="Up to 650 KB. Stored on Cloudinary, only the link is saved.">
                        <input
                            ref={fileRef}
                            type="file"
                            accept="application/pdf"
                            disabled={busy}
                            onChange={(event) => chooseFile(event.target.files?.[0])}
                            className="block w-full cursor-pointer rounded-lg border px-3 py-2 text-xs file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-black/5 file:px-2.5 file:py-1.5 file:text-[11px] file:font-semibold"
                            style={{ borderColor: Theme.colors.border, color: Theme.colors.text }}
                        />
                        {file && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-[11px]" style={{ color: Theme.colors.primaryDark }}>
                                <FileText size={12} />
                                {file.name} · ready to upload
                            </p>
                        )}
                    </Field>

                    <Field
                        label="…or a hosted link"
                        hint="Use this for a PDF already online (no size limit here)."
                    >
                        <TextInput
                            value={link}
                            onChange={(event) => setLink(event.target.value)}
                            placeholder="https://example.com/catalogue.pdf"
                            inputMode="url"
                        />
                    </Field>

                    {existing && (
                        <div
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5"
                            style={{ backgroundColor: Theme.colors.surfaceAlt }}
                        >
                            <div className="min-w-0">
                                <p className="truncate text-[12px] font-semibold">{existing.title}</p>
                                <p className="text-[10.5px]" style={{ color: Theme.colors.textMuted }}>
                                    Live since {new Date(existing.uploadedAt).toLocaleDateString('en-IN')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={existing.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-semibold underline-offset-2 hover:underline"
                                    style={{ color: Theme.colors.primaryDark }}
                                >
                                    Open
                                </a>
                                <AdminButton variant="danger" onClick={remove} disabled={busy}>
                                    <Trash2 size={12} />
                                    Remove
                                </AdminButton>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <AdminButton onClick={() => onOpenChange(false)} disabled={busy}>
                        Cancel
                    </AdminButton>
                    <AdminButton variant="primary" onClick={save} disabled={busy}>
                        {busy ? 'Saving…' : existing ? 'Replace catalogue' : 'Upload catalogue'}
                    </AdminButton>
                </div>
            </DialogContent>
        </Dialog>
    );
}
