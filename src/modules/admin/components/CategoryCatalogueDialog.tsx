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
    useAddCategoryCatalogue,
    useRemoveAdditionalCategoryCatalogue,
    useRemoveCategoryCatalogue,
} from '@/modules/products/api/useProducts';
import type { ProductCategory } from '@/modules/products/api/productApi';
import { catalogueHref } from '@/modules/catalogue/lib/catalogueUrl';
import { uploadMediaFile } from '@/modules/admin/api/mediaUploadApi';
import { AdminButton, Field, TextArea, TextInput } from './AdminUI';

/** A catalogue is usually a PDF; a Word document is accepted too. */
const DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * The official catalogue for one category.
 *
 * Adds independently downloadable files to a category. Each upload is its own
 * catalogue entry; existing legacy catalogue files remain manageable here too.
 *
 * The file is read as a data URI and posted as JSON; the API stores the bytes
 * and serves them from its own download route, so the link carries the right
 * content type and filename.
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
    const addCatalogue = useAddCategoryCatalogue();
    const removeCatalogue = useRemoveCategoryCatalogue();
    const removeAdditionalCatalogue = useRemoveAdditionalCategoryCatalogue();
    const fileRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState(`${category.label} catalogue`);
    const [description, setDescription] = useState(existing?.description ?? '');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const busy = uploading || addCatalogue.isPending || removeCatalogue.isPending || removeAdditionalCatalogue.isPending;

    function chooseFile(selected: File | undefined) {
        if (!selected) {
            setFile(null);
            return;
        }
        const type = selected.type || (/\.[a-z]+$/i.exec(selected.name)?.[0] ?? '');
        if (!DOCUMENT_TYPES.includes(type) && !/\.(pdf|doc|docx)$/i.test(selected.name)) {
            toast.error('Choose a PDF or Word document');
            return;
        }
        setFile(selected);
    }

    async function save() {
        if (!file) {
            toast.error('Choose a PDF or Word document to upload');
            return;
        }
        if (title.trim().length < 2) {
            toast.error('Give the catalogue a title');
            return;
        }

        setUploading(true);
        try {
            const url = await uploadMediaFile(file, 'raw', 'catalogues');
            await addCatalogue.mutateAsync({
                slug: category.id,
                input: { title: title.trim(), description: description.trim(), file: url },
            });
            toast.success('Catalogue added', { description: `${category.label} · ${title.trim()}` });
            setFile(null);
            if (fileRef.current) fileRef.current.value = '';
            setTitle(`${category.label} catalogue`);
            setDescription('');
        } catch (error) {
            toast.error('Could not upload the catalogue', {
                description: error instanceof Error ? error.message : 'Please try again.',
            });
        } finally {
            setUploading(false);
        }
    }

    function remove() {
        removeCatalogue.mutate(category.id, {
            onSuccess: () => {
                toast.success('Catalogue removed', { description: category.label });
                setFile(null);
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
                {category.label} · catalogues
                    </DialogTitle>
                    <DialogDescription>
                        Upload each catalogue separately. Every file gets its own download on the storefront.
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

                    <Field
                        label="PDF or Word document"
                        hint="Files upload directly to Cloudinary. The file limit is 50 MB."
                    >
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                                    href={catalogueHref(existing)}
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

                    {(category.catalogues?.length ?? 0) > 0 && (
                        <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: Theme.colors.border }}>
                            <p className="text-xs font-semibold">Uploaded catalogues ({category.catalogues?.length})</p>
                            {category.catalogues?.map((catalogue) => (
                                <div key={catalogue.id} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: Theme.colors.surfaceAlt }}>
                                    <div className="min-w-0">
                                        <p className="truncate text-[12px] font-semibold">{catalogue.title}</p>
                                        {catalogue.description && <p className="truncate text-[10.5px]" style={{ color: Theme.colors.textMuted }}>{catalogue.description}</p>}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <a href={catalogueHref(catalogue)} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold underline-offset-2 hover:underline" style={{ color: Theme.colors.primaryDark }}>Open</a>
                                        <AdminButton
                                            variant="danger"
                                            disabled={busy || !catalogue.id}
                                            onClick={() => catalogue.id && removeAdditionalCatalogue.mutate(
                                                { slug: category.id, catalogueId: catalogue.id },
                                                {
                                                    onSuccess: () => toast.success('Catalogue removed', { description: catalogue.title }),
                                                    onError: (error) => toast.error('Could not remove the catalogue', { description: error instanceof Error ? error.message : 'Please try again.' }),
                                                }
                                            )}
                                        >
                                            <Trash2 size={12} /> Remove
                                        </AdminButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <AdminButton onClick={() => onOpenChange(false)} disabled={busy}>
                        Cancel
                    </AdminButton>
                    <AdminButton variant="primary" onClick={save} disabled={busy || !file}>
                        {busy ? 'Uploading…' : 'Add catalogue'}
                    </AdminButton>
                </div>
            </DialogContent>
        </Dialog>
    );
}
