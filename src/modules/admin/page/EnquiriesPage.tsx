import { useState } from 'react';
import { CheckCheck, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AdminButton, AdminTabs, PageHeader, Panel } from '../components/AdminUI';
import {
    useAdminEnquiries,
    useMarkAllEnquiriesRead,
    useMarkEnquiryRead,
} from '../api/useAdmin';
import type { AdminEnquiry } from '../api/adminApi';

const stamp = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const when = (iso: string) => stamp.format(new Date(iso));

const KIND_LABEL: Record<AdminEnquiry['kind'], string> = {
    footer: 'Footer card',
    contact: 'Contact form',
};

function Pill({ children, tone = 'muted' }: { children: string; tone?: 'muted' | 'new' | 'warn' }) {
    const palette = {
        muted: { backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.textMuted },
        new: { backgroundColor: Theme.colors.primaryDark, color: Theme.colors.white },
        warn: { backgroundColor: '#FDF1E7', color: '#9A4B12' },
    } as const;

    return (
        <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
            style={palette[tone]}
        >
            {children}
        </span>
    );
}

/**
 * The shop's inbox.
 *
 * Every enquiry is stored before WhatsApp delivery is attempted, so this list
 * is the complete record - including messages whose template never arrived,
 * which are flagged instead of hidden. Unread is per row so the shop can clear
 * the list in one tap and still see what came in today.
 */
export default function EnquiriesPage() {
    const [status, setStatus] = useState<'all' | 'unread'>('all');
    const [page, setPage] = useState(1);
    const [openId, setOpenId] = useState<string | null>(null);

    const { data, isLoading, error } = useAdminEnquiries({ status, page });
    const markRead = useMarkEnquiryRead();
    const markAll = useMarkAllEnquiriesRead();

    const items = data?.items ?? [];
    const active = items.find((entry) => entry.id === openId) ?? null;

    async function toggleRead(entry: AdminEnquiry) {
        try {
            await markRead.mutateAsync({ id: entry.id, read: !entry.read });
            toast.success(entry.read ? 'Marked as unread' : 'Marked as read');
        } catch (cause) {
            toast.error(cause instanceof Error ? cause.message : 'Could not update the enquiry');
        }
    }

    async function readAll() {
        try {
            const result = await markAll.mutateAsync();
            toast.success(
                result.updated > 0
                    ? `${result.updated} ${result.updated === 1 ? 'enquiry' : 'enquiries'} marked as read`
                    : 'Everything was already read',
            );
        } catch (cause) {
            toast.error(cause instanceof Error ? cause.message : 'Could not mark enquiries as read');
        }
    }

    return (
        <>
            <PageHeader
                title="Enquiries"
                description="Every message sent from the storefront — who sent it, how to reply and when it arrived."
            >
                <AdminButton
                    variant="primary"
                    onClick={readAll}
                    disabled={markAll.isPending || !data?.unread}
                >
                    <CheckCheck size={14} />
                    {markAll.isPending ? 'Marking…' : 'Mark all as read'}
                </AdminButton>
            </PageHeader>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <AdminTabs
                    label="Filter enquiries"
                    value={status}
                    onChange={(next) => {
                        setStatus(next === 'unread' ? 'unread' : 'all');
                        setPage(1);
                    }}
                    tabs={[
                        { value: 'all', label: `All${data ? ` (${data.total})` : ''}` },
                        { value: 'unread', label: `Unread${data ? ` (${data.unread})` : ''}` },
                    ]}
                />

                {data && data.unread > 0 && (
                    <p className="text-xs" style={{ color: Theme.colors.textMuted }}>
                        {data.unread} waiting for a reply
                    </p>
                )}
            </div>

            <Panel>
                {isLoading ? (
                    <p className="px-5 py-10 text-center text-sm" style={{ color: Theme.colors.textMuted }}>
                        Loading enquiries…
                    </p>
                ) : error ? (
                    <div className="px-5 py-10 text-center">
                        <p className="text-sm font-semibold" style={{ color: Theme.colors.text }}>
                            Enquiries could not be loaded
                        </p>
                        <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                            {error instanceof Error ? error.message : 'Please try again.'}
                        </p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <p className="text-sm font-semibold" style={{ color: Theme.colors.text }}>
                            {status === 'unread' ? 'No unread enquiries' : 'No enquiries yet'}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                            {status === 'unread'
                                ? 'Everything that has come in is already read.'
                                : 'Messages from the footer card and the Contact page will land here.'}
                        </p>
                    </div>
                ) : (
                    <ul>
                        {items.map((entry) => (
                            <li
                                key={entry.id}
                                className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:px-5"
                                style={{ borderColor: Theme.colors.border }}
                            >
                                <div className="flex min-w-0 gap-3">
                                    <span
                                        aria-hidden="true"
                                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                                        style={{
                                            backgroundColor: entry.read
                                                ? 'transparent'
                                                : Theme.colors.primaryDark,
                                            border: entry.read
                                                ? `1px solid ${Theme.colors.borderStrong}`
                                                : 'none',
                                        }}
                                    />
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p
                                                className="truncate text-sm font-semibold"
                                                style={{ color: Theme.colors.text }}
                                            >
                                                {entry.name}
                                            </p>
                                            <Pill>{KIND_LABEL[entry.kind]}</Pill>
                                            {!entry.read && <Pill tone="new">New</Pill>}
                                            {!entry.delivered && <Pill tone="warn">Not delivered</Pill>}
                                        </div>

                                        {entry.subject && (
                                            <p
                                                className="mt-1 truncate text-[13px] font-medium"
                                                style={{ color: Theme.colors.text }}
                                            >
                                                {entry.subject}
                                            </p>
                                        )}

                                        <p
                                            className="mt-1 line-clamp-2 text-[13px] leading-relaxed"
                                            style={{ color: Theme.colors.textMuted }}
                                        >
                                            {entry.message ?? 'Asked a question from the footer.'}
                                        </p>

                                        <div
                                            className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]"
                                            style={{ color: Theme.colors.textMuted }}
                                        >
                                            {entry.phone && (
                                                <span className="inline-flex items-center gap-1">
                                                    <Phone size={11} />
                                                    {entry.phone}
                                                </span>
                                            )}
                                            {entry.email && (
                                                <span className="inline-flex min-w-0 items-center gap-1">
                                                    <Mail size={11} />
                                                    <span className="truncate">{entry.email}</span>
                                                </span>
                                            )}
                                            <span>{when(entry.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                                    <AdminButton onClick={() => setOpenId(entry.id)}>View</AdminButton>
                                    <AdminButton
                                        onClick={() => toggleRead(entry)}
                                        disabled={markRead.isPending}
                                    >
                                        {entry.read ? 'Mark unread' : 'Mark read'}
                                    </AdminButton>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>

            {data && data.pages > 1 && (
                <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: Theme.colors.textMuted }}>
                        Page {data.page} of {data.pages}
                    </p>
                    <div className="flex items-center gap-2">
                        <AdminButton
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            disabled={data.page <= 1}
                        >
                            Previous
                        </AdminButton>
                        <AdminButton
                            onClick={() => setPage((current) => Math.min(data.pages, current + 1))}
                            disabled={data.page >= data.pages}
                        >
                            Next
                        </AdminButton>
                    </div>
                </div>
            )}

            <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setOpenId(null)}>
                <DialogContent className="sm:max-w-lg">
                    {active && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{active.name}</DialogTitle>
                                <DialogDescription>
                                    {KIND_LABEL[active.kind]} · {when(active.createdAt)}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex flex-wrap items-center gap-2">
                                <Pill>{KIND_LABEL[active.kind]}</Pill>
                                <Pill tone={active.read ? 'muted' : 'new'}>
                                    {active.read ? 'Read' : 'Unread'}
                                </Pill>
                                <Pill tone={active.delivered ? 'muted' : 'warn'}>
                                    {active.delivered ? 'Delivered' : 'Not delivered'}
                                </Pill>
                            </div>

                            <dl className="mt-4 space-y-3 text-sm">
                                {active.subject && (
                                    <div>
                                        <dt
                                            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                                            style={{ color: Theme.colors.textMuted }}
                                        >
                                            Subject
                                        </dt>
                                        <dd style={{ color: Theme.colors.text }}>{active.subject}</dd>
                                    </div>
                                )}

                                {active.message && (
                                    <div>
                                        <dt
                                            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                                            style={{ color: Theme.colors.textMuted }}
                                        >
                                            Message
                                        </dt>
                                        <dd
                                            className="mt-1 whitespace-pre-line leading-relaxed"
                                            style={{ color: Theme.colors.text }}
                                        >
                                            {active.message}
                                        </dd>
                                    </div>
                                )}

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <dt
                                            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                                            style={{ color: Theme.colors.textMuted }}
                                        >
                                            Phone
                                        </dt>
                                        <dd style={{ color: Theme.colors.text }}>
                                            {active.phone ? (
                                                <a className="hover:underline" href={`tel:${active.phone}`}>
                                                    {active.phone}
                                                </a>
                                            ) : (
                                                'Not provided'
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt
                                            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                                            style={{ color: Theme.colors.textMuted }}
                                        >
                                            Email
                                        </dt>
                                        <dd className="break-words" style={{ color: Theme.colors.text }}>
                                            {active.email ? (
                                                <a
                                                    className="hover:underline"
                                                    href={`mailto:${active.email}`}
                                                >
                                                    {active.email}
                                                </a>
                                            ) : (
                                                'Not provided'
                                            )}
                                        </dd>
                                    </div>
                                </div>

                                <div>
                                    <dt
                                        className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                                        style={{ color: Theme.colors.textMuted }}
                                    >
                                        Received
                                    </dt>
                                    <dd style={{ color: Theme.colors.text }}>{when(active.createdAt)}</dd>
                                </div>
                            </dl>

                            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                                <AdminButton
                                    onClick={() => toggleRead(active)}
                                    disabled={markRead.isPending}
                                >
                                    {active.read ? 'Mark unread' : 'Mark read'}
                                </AdminButton>
                                <AdminButton variant="primary" onClick={() => setOpenId(null)}>
                                    Close
                                </AdminButton>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
