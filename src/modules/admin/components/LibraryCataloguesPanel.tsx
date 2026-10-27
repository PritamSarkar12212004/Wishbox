import { useRef, useState } from 'react';
import { FileText, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import {
    useAddLibraryCatalogue,
    useCatalogueLibrary,
    useRemoveLibraryCatalogue,
} from '@/modules/products/api/useProducts';
import { uploadMediaFile } from '@/modules/admin/api/mediaUploadApi';
import { catalogueHref } from '@/modules/catalogue/lib/catalogueUrl';
import { AdminButton, Field, Panel, PanelHeader, TextArea, TextInput } from './AdminUI';

/** A catalogue is usually a PDF; a Word document is accepted too. */
const DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Upload catalogues that belong to no category.
 *
 * The category table is about one collection at a time; this is for the files
 * that cover the whole shop - a season lookbook, a trade price list, a gifting
 * guide. Any number can be added, each with its own title and short line of copy.
 */
export default function LibraryCataloguesPanel() {
    const catalogues = useCatalogueLibrary();
    const addCatalogue = useAddLibraryCatalogue();
    const removeCatalogue = useRemoveLibraryCatalogue();

    const fileRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const busy = uploading || addCatalogue.isPending || removeCatalogue.isPending;

    function chooseFile(selected: File | undefined) {
        if (!selected) {
            setFile(null);
            return;
        }
        if (!DOCUMENT_TYPES.includes(selected.type) && !/\.(pdf|doc|docx)$/i.test(selected.name)) {
            toast.error('Choose a PDF or Word document');
            return;
        }
        setFile(selected);
        // The title follows the file until the admin types one.
        if (!title.trim()) {
            setTitle(selected.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim());
        }
    }

    async function upload() {
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
                title: title.trim(),
                description: description.trim(),
                file: url,
            });
            toast.success('Catalogue added', { description: title.trim() });
            setTitle('');
            setDescription('');
            setFile(null);
            if (fileRef.current) fileRef.current.value = '';
        } catch (error) {
            toast.error('Could not upload the catalogue', {
                description: error instanceof Error ? error.message : 'Please try again.',
            });
        } finally {
            setUploading(false);
        }
    }

    function remove(id: string, label: string) {
        removeCatalogue.mutate(id, {
            onSuccess: () => toast.success('Catalogue removed', { description: label }),
            onError: (error) =>
                toast.error('Could not remove the catalogue', {
                    description: error instanceof Error ? error.message : 'Please try again.',
                }),
        });
    }

    return (
        <div className="flex flex-col gap-6">
            <Panel>
                <PanelHeader
                    title="Upload a catalogue"
                    meta="Not tied to any category — a lookbook, trade list or gift guide"
                    action={<UploadCloud size={15} style={{ color: Theme.colors.primaryDark }} />}
                />
                <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Title" hint="Shown beside the download card.">
                            <TextInput
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                maxLength={80}
                                placeholder="Spring 2026 lookbook"
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
                    </div>

                    <Field label="PDF or Word document" hint="Upload as many catalogues as you like.">
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
                            <p
                                className="mt-1.5 flex items-center gap-1.5 text-[11px]"
                                style={{ color: Theme.colors.primaryDark }}
                            >
                                <FileText size={12} />
                                {file.name} · ready to upload
                            </p>
                        )}
                    </Field>

                    <div>
                        <AdminButton
                            variant="primary"
                            onClick={upload}
                            disabled={busy || !file || !title.trim()}
                        >
                            <UploadCloud size={13} />
                            {busy ? 'Uploading…' : 'Add catalogue'}
                        </AdminButton>
                    </div>
                </div>
            </Panel>

            <Panel>
                <PanelHeader
                    title="Other catalogues"
                    meta={`${catalogues.length} file${catalogues.length === 1 ? '' : 's'} on the storefront catalogue page`}
                />
                <ul>
                    {catalogues.map((catalogue) => (
                        <li
                            key={catalogue.id}
                            className="flex flex-wrap items-center gap-3 border-t px-4 py-3 first:border-t-0 sm:px-5"
                            style={{ borderColor: Theme.colors.border }}
                        >
                            <span
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                                style={{ backgroundColor: Theme.colors.surfaceAlt }}
                            >
                                <FileText size={15} style={{ color: Theme.colors.primaryDark }} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold">{catalogue.title}</p>
                                <p
                                    className="mt-0.5 truncate text-[10.5px]"
                                    style={{ color: Theme.colors.textMuted }}
                                >
                                    {catalogue.description || catalogue.fileName} ·{' '}
                                    {new Date(catalogue.uploadedAt).toLocaleDateString('en-IN')}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <a
                                    href={catalogueHref(catalogue)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-semibold underline-offset-2 hover:underline"
                                    style={{ color: Theme.colors.primaryDark }}
                                >
                                    Open
                                </a>
                                <AdminButton
                                    variant="danger"
                                    disabled={busy}
                                    onClick={() => remove(catalogue.id, catalogue.title)}
                                >
                                    <Trash2 size={12} /> Remove
                                </AdminButton>
                            </div>
                        </li>
                    ))}
                    {catalogues.length === 0 && (
                        <li
                            className="px-4 py-10 text-center text-xs"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            No general catalogues yet. Upload one above and it appears on the storefront
                            catalogue page.
                        </li>
                    )}
                </ul>
            </Panel>
        </div>
    );
}
