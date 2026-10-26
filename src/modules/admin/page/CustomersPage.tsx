import { useMemo, useState } from 'react';
import { Phone, Search } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { PageHeader, TextInput } from '../components/AdminUI';
import DataTable from '../components/DataTable';
import { useAdminFeed } from '../hooks/useAdminFeed';

/**
 * Digits only, so a search reads the same whether the admin types `88767`,
 * `88767 46838` or the full `+91 88767 46838` the record stores.
 */
const digitsOf = (value: string) => value.replace(/\D/g, '');

/**
 * The customer directory: a name and the number support dials.
 *
 * Everything else the panel could compute — city, join date, order counts,
 * lifetime value, top spenders — is switched off for now while the customer
 * screens are reworked, so this page stays a plain, truthful list.
 */
export default function CustomersPage() {
    const { dataset } = useAdminFeed();
    const [search, setSearch] = useState('');

    const rows = useMemo(
        () =>
            dataset.customers
                .filter((customer) => !customer.isGuest)
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name)),
        [dataset.customers]
    );

    const visible = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return rows;
        /* Three digits is the shortest fragment that still identifies one number. */
        const phoneQuery = digitsOf(query);
        return rows.filter((row) => {
            if (row.name.toLowerCase().includes(query)) return true;
            return phoneQuery.length >= 3 && digitsOf(row.phone).includes(phoneQuery);
        });
    }, [rows, search]);

    return (
        <div>
            <PageHeader
                title="Customers"
                description="Registered shoppers · name and WhatsApp number. Guest checkouts are counted separately and never listed here."
            />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                    {visible.length} {visible.length === 1 ? 'customer' : 'customers'}
                </p>
                <div className="relative w-full max-w-xs">
                    <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: Theme.colors.textMuted }}
                    />
                    <TextInput
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search name or phone number"
                        inputMode="search"
                        className="pl-9"
                        aria-label="Search customers by name or phone number"
                    />
                </div>
            </div>

            <DataTable
                minWidth={420}
                rows={visible.slice(0, 60)}
                rowKey={(row) => row.id}
                emptyTitle="No customers match"
                emptyHint="Try a different name or phone number."
                columns={[
                    {
                        key: 'name',
                        header: 'Customer',
                        render: (row) => <span className="truncate text-[13px] font-bold">{row.name}</span>,
                    },
                    {
                        key: 'phone',
                        header: 'Phone number',
                        render: (row) => (
                            <a
                                href={`tel:${row.phone.replace(/[^\d+]/g, '')}`}
                                className="inline-flex items-center gap-1.5 text-[13px] font-medium tabular-nums transition-colors hover:opacity-70"
                                style={{ color: Theme.colors.accentDark }}
                            >
                                <Phone size={13} />
                                {row.phone}
                            </a>
                        ),
                    },
                ]}
                footer={
                    visible.length > 60 && (
                        <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                            Showing 60 of {visible.length} customers — search to narrow the list.
                        </p>
                    )
                }
            />
        </div>
    );
}
