import { useMemo, useState } from 'react';
import { Heart, Search, ShoppingCart } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { compactCount, inr } from '@/lib/format';
import { AdminTabs, PageHeader, Panel, TextInput } from '../components/AdminUI';
import DataTable from '../components/DataTable';
import Tile from '../components/Tile';
import { useAdminDataset } from '../hooks/useAdminFeed';

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
const DATE_TIME = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
});

type Tab = 'products' | 'shoppers' | 'activity';

/** One product, with everything both signals say about it. */
type ProductRow = {
    productId: string;
    name: string;
    image: string;
    price: number;
    available: boolean;
    hidden: boolean;
    /** Distinct shoppers who saved it. */
    saves: number;
    savers: string[];
    /** Distinct shoppers who put it in a cart. */
    cartShoppers: number;
    cartAdds: number;
    cartUnits: number;
    lastAt: number;
    /** A save is a stronger signal than a cart tap, so it weighs double. */
    interest: number;
};

/** One shopper, with both signals rolled up. */
type ShopperRow = {
    key: string;
    customer: string;
    phone: string;
    saves: number;
    cartAdds: number;
    cartUnits: number;
    lastAt: number;
    savedNames: string[];
    cartNames: string[];
};

type ActivityRow = {
    id: string;
    kind: 'wishlist' | 'cart';
    customer: string;
    phone: string;
    name: string;
    productId: string;
    qty: number;
    adds: number;
    at: number;
};

/** The same shopper key the wishlist report already uses: phone, then name. */
const shopperKey = (entry: { phone: string; customer: string }) => entry.phone || entry.customer;

/**
 * Customer interest — wishlist saves and add-to-cart, in one place.
 *
 * Both numbers come from the API's own rows: a wishlist row is one shopper and
 * one product, and a cart-interest row is one shopper's taps on one product. So
 * "shoppers" is a count of people and "adds" is a count of taps, and the table
 * never mixes the two.
 *
 * Three views, because they answer different questions:
 *  - Products: which products people want, ranked by combined interest.
 *  - Shoppers: who wants the most, so a big order or a follow-up has a number.
 *  - Activity: the newest signals, in the order they happened.
 */
export default function InterestPage() {
    const dataset = useAdminDataset();
    const [tab, setTab] = useState<Tab>('products');
    const [search, setSearch] = useState('');

    const cartRows = dataset.cartInterest ?? [];

    const products = useMemo<ProductRow[]>(() => {
        const map = new Map<string, ProductRow>();

        const rowFor = (entry: {
            productId: string;
            name: string;
            image: string;
            price: number;
            available: boolean;
            hidden: boolean;
        }) => {
            const existing = map.get(entry.productId);
            if (existing) return existing;

            const created: ProductRow = {
                productId: entry.productId,
                name: entry.name,
                image: entry.image,
                price: entry.price,
                available: entry.available,
                hidden: entry.hidden,
                saves: 0,
                savers: [],
                cartShoppers: 0,
                cartAdds: 0,
                cartUnits: 0,
                lastAt: 0,
                interest: 0,
            };
            map.set(entry.productId, created);
            return created;
        };

        dataset.wishlist.forEach((entry) => {
            const row = rowFor(entry);
            row.saves += 1;
            row.savers.push(shopperKey(entry));
            row.lastAt = Math.max(row.lastAt, entry.savedAt);
        });

        cartRows.forEach((entry) => {
            const row = rowFor(entry);
            row.cartShoppers += 1;
            row.cartAdds += entry.adds;
            row.cartUnits += entry.units;
            row.lastAt = Math.max(row.lastAt, entry.lastAt);
        });

        return [...map.values()]
            .map((row) => ({ ...row, interest: row.saves * 2 + row.cartAdds }))
            .sort((a, b) => b.interest - a.interest || b.lastAt - a.lastAt);
    }, [dataset.wishlist, cartRows]);

    const shoppers = useMemo<ShopperRow[]>(() => {
        const map = new Map<string, ShopperRow>();

        const rowFor = (entry: { customer: string; phone: string }) => {
            const key = shopperKey(entry);
            const existing = map.get(key);
            if (existing) return existing;

            const created: ShopperRow = {
                key,
                customer: entry.customer,
                phone: entry.phone,
                saves: 0,
                cartAdds: 0,
                cartUnits: 0,
                lastAt: 0,
                savedNames: [],
                cartNames: [],
            };
            map.set(key, created);
            return created;
        };

        dataset.wishlist.forEach((entry) => {
            const row = rowFor(entry);
            row.saves += 1;
            row.savedNames.push(entry.name);
            row.lastAt = Math.max(row.lastAt, entry.savedAt);
        });

        cartRows.forEach((entry) => {
            const row = rowFor(entry);
            row.cartAdds += entry.adds;
            row.cartUnits += entry.units;
            row.cartNames.push(`${entry.name} ×${entry.units}`);
            row.lastAt = Math.max(row.lastAt, entry.lastAt);
        });

        return [...map.values()].sort(
            (a, b) => b.saves + b.cartAdds - (a.saves + a.cartAdds) || b.lastAt - a.lastAt
        );
    }, [dataset.wishlist, cartRows]);

    const activity = useMemo<ActivityRow[]>(() => {
        const saves: ActivityRow[] = dataset.wishlist.map((entry) => ({
            id: `w-${entry.productId}-${entry.phone}-${entry.savedAt}`,
            kind: 'wishlist',
            customer: entry.customer,
            phone: entry.phone,
            name: entry.name,
            productId: entry.productId,
            qty: 0,
            adds: 0,
            at: entry.savedAt,
        }));

        const carts: ActivityRow[] = cartRows.map((entry) => ({
            id: `c-${entry.productId}-${entry.phone}`,
            kind: 'cart',
            customer: entry.customer,
            phone: entry.phone,
            name: entry.name,
            productId: entry.productId,
            qty: entry.units,
            adds: entry.adds,
            at: entry.lastAt,
        }));

        return [...saves, ...carts].sort((a, b) => b.at - a.at).slice(0, 100);
    }, [dataset.wishlist, cartRows]);

    const totals = useMemo(
        () => ({
            saves: dataset.wishlist.length,
            wishlistShoppers: new Set(dataset.wishlist.map(shopperKey)).size,
            cartAdds: cartRows.reduce((sum, entry) => sum + entry.adds, 0),
            cartShoppers: new Set(cartRows.map(shopperKey)).size,
            cartUnits: cartRows.reduce((sum, entry) => sum + entry.units, 0),
            products: products.length,
        }),
        [dataset.wishlist, cartRows, products.length]
    );

    const query = search.trim().toLowerCase();

    const visibleProducts = useMemo(
        () =>
            !query
                ? products
                : products.filter((row) => row.name.toLowerCase().includes(query)),
        [products, query]
    );

    const visibleShoppers = useMemo(
        () =>
            !query
                ? shoppers
                : shoppers.filter(
                      (row) =>
                          row.customer.toLowerCase().includes(query) ||
                          row.phone.includes(query) ||
                          row.savedNames.some((name) => name.toLowerCase().includes(query)) ||
                          row.cartNames.some((name) => name.toLowerCase().includes(query))
                  ),
        [shoppers, query]
    );

    const visibleActivity = useMemo(
        () =>
            !query
                ? activity
                : activity.filter(
                      (row) =>
                          row.customer.toLowerCase().includes(query) ||
                          row.phone.includes(query) ||
                          row.name.toLowerCase().includes(query)
                  ),
        [activity, query]
    );

    return (
        <div>
            <PageHeader
                title="Customer interest"
                description="Who saved what, who put what in a cart, and how much they asked for — recorded from the storefront as it happens."
            />

            {/* ── Numbers ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Panel>
                    <Tile label="Wishlist saves" value={compactCount(totals.saves)} hint="One per shopper per product" />
                </Panel>
                <Panel>
                    <Tile label="Wishlist shoppers" value={compactCount(totals.wishlistShoppers)} hint="People with saves" />
                </Panel>
                <Panel>
                    <Tile label="Cart adds" value={compactCount(totals.cartAdds)} hint="Taps on add to cart" />
                </Panel>
                <Panel>
                    <Tile label="Cart shoppers" value={compactCount(totals.cartShoppers)} hint="People who added" />
                </Panel>
                <Panel>
                    <Tile label="Units in carts" value={compactCount(totals.cartUnits)} hint="Quantity asked for" tone="good" />
                </Panel>
                <Panel>
                    <Tile label="Products wanted" value={compactCount(totals.products)} hint="Saved or carted" />
                </Panel>
            </div>

            {/* ── Controls ────────────────────────────────────────── */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <AdminTabs
                    label="Customer interest view"
                    value={tab}
                    onChange={(next) => setTab(next as Tab)}
                    tabs={[
                        { value: 'products', label: `Products (${products.length})` },
                        { value: 'shoppers', label: `Shoppers (${shoppers.length})` },
                        { value: 'activity', label: 'Activity' },
                    ]}
                />

                <div className="relative w-full max-w-xs">
                    <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: Theme.colors.textMuted }}
                    />
                    <TextInput
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={
                            tab === 'products'
                                ? 'Search a product'
                                : tab === 'shoppers'
                                  ? 'Search a name, phone or product'
                                  : 'Search activity'
                        }
                        inputMode="search"
                        className="pl-9"
                        aria-label="Search customer interest"
                    />
                </div>
            </div>

            <div className="mt-4">
                {tab === 'products' && (
                    <DataTable
                        minWidth={860}
                        rows={visibleProducts}
                        rowKey={(row) => row.productId}
                        emptyTitle={products.length === 0 ? 'No interest yet' : 'Nothing matches'}
                        emptyHint={
                            products.length === 0
                                ? 'A save or an add to cart appears here as soon as a signed-in shopper makes one.'
                                : 'Try a different product name.'
                        }
                        columns={[
                            {
                                key: 'product',
                                header: 'Product',
                                render: (row) => (
                                    <div className="flex min-w-0 items-center gap-3">
                                        {row.image ? (
                                            <img
                                                src={row.image}
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                                className="h-10 w-10 shrink-0 rounded-lg object-cover"
                                                style={{ border: `1px solid ${Theme.colors.border}` }}
                                            />
                                        ) : (
                                            <span
                                                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                                                style={{ backgroundColor: Theme.colors.surfaceAlt }}
                                            >
                                                <Heart size={15} style={{ color: Theme.colors.textMuted }} />
                                            </span>
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate text-[13px] font-bold">{row.name}</p>
                                            <p
                                                className="mt-0.5 text-[11px]"
                                                style={{ color: Theme.colors.textMuted }}
                                            >
                                                {inr(row.price)} ·{' '}
                                                {row.hidden
                                                    ? 'Unpublished'
                                                    : row.available
                                                      ? 'In stock'
                                                      : 'Out of stock'}
                                            </p>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: 'saves',
                                header: 'Wishlist',
                                align: 'right',
                                render: (row) => (
                                    <div>
                                        <p className="text-[13px] font-bold tabular-nums">{row.saves}</p>
                                        <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                            {row.saves === 1 ? '1 person' : `${row.saves} people`}
                                        </p>
                                    </div>
                                ),
                            },
                            {
                                key: 'cart',
                                header: 'Cart',
                                align: 'right',
                                render: (row) => (
                                    <div>
                                        <p className="text-[13px] font-bold tabular-nums">{row.cartUnits} units</p>
                                        <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                            {row.cartShoppers === 1 ? '1 person' : `${row.cartShoppers} people`} ·{' '}
                                            {row.cartAdds} add{row.cartAdds === 1 ? '' : 's'}
                                        </p>
                                    </div>
                                ),
                            },
                            {
                                key: 'interest',
                                header: 'Interest',
                                align: 'right',
                                hideBelow: 'sm',
                                render: (row) => (
                                    <span
                                        className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
                                        style={{
                                            backgroundColor: Theme.colors.primaryLight,
                                            color: Theme.colors.primaryDark,
                                        }}
                                        title="Saves count double: a save is a deliberate wish, a cart tap is intent"
                                    >
                                        {row.interest}
                                    </span>
                                ),
                            },
                            {
                                key: 'last',
                                header: 'Last activity',
                                align: 'right',
                                hideBelow: 'md',
                                render: (row) => (
                                    <span className="text-xs" style={{ color: Theme.colors.textMuted }}>
                                        {row.lastAt > 0 ? DATE.format(row.lastAt) : '—'}
                                    </span>
                                ),
                            },
                        ]}
                    />
                )}

                {tab === 'shoppers' && (
                    <DataTable
                        minWidth={780}
                        rows={visibleShoppers}
                        rowKey={(row) => row.key}
                        emptyTitle={shoppers.length === 0 ? 'No shoppers yet' : 'Nothing matches'}
                        emptyHint={
                            shoppers.length === 0
                                ? 'Sign-in is required to save or add to cart, so every row here is a real account.'
                                : 'Try a different name, phone number or product.'
                        }
                        columns={[
                            {
                                key: 'shopper',
                                header: 'Shopper',
                                render: (row) => (
                                    <div className="min-w-0">
                                        <p className="truncate text-[13px] font-bold">{row.customer}</p>
                                        <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                            {row.phone || 'No number on file'}
                                        </p>
                                    </div>
                                ),
                            },
                            {
                                key: 'saves',
                                header: 'Wishlist',
                                align: 'right',
                                render: (row) => (
                                    <span className="text-[13px] font-bold tabular-nums">{row.saves}</span>
                                ),
                            },
                            {
                                key: 'adds',
                                header: 'Cart adds',
                                align: 'right',
                                render: (row) => (
                                    <span className="text-[13px] font-bold tabular-nums">{row.cartAdds}</span>
                                ),
                            },
                            {
                                key: 'units',
                                header: 'Units',
                                align: 'right',
                                hideBelow: 'sm',
                                render: (row) => (
                                    <span className="text-xs tabular-nums">{row.cartUnits}</span>
                                ),
                            },
                            {
                                key: 'wants',
                                header: 'What they want',
                                hideBelow: 'md',
                                render: (row) => {
                                    const wants = [...row.savedNames, ...row.cartNames];
                                    const shown = wants.slice(0, 2);
                                    const extra = wants.length - shown.length;

                                    return (
                                        <div className="flex flex-col gap-0.5">
                                            {shown.map((name, index) => (
                                                <span key={`${name}-${index}`} className="truncate text-[12px]">
                                                    {name}
                                                </span>
                                            ))}
                                            {extra > 0 && (
                                                <span
                                                    className="text-[11px]"
                                                    style={{ color: Theme.colors.textMuted }}
                                                >
                                                    +{extra} more
                                                </span>
                                            )}
                                        </div>
                                    );
                                },
                            },
                            {
                                key: 'last',
                                header: 'Last active',
                                align: 'right',
                                render: (row) => (
                                    <span className="text-xs" style={{ color: Theme.colors.textMuted }}>
                                        {row.lastAt > 0 ? DATE.format(row.lastAt) : '—'}
                                    </span>
                                ),
                            },
                        ]}
                    />
                )}

                {tab === 'activity' && (
                    <DataTable
                        minWidth={720}
                        rows={visibleActivity}
                        rowKey={(row) => row.id}
                        emptyTitle={activity.length === 0 ? 'No activity yet' : 'Nothing matches'}
                        emptyHint={
                            activity.length === 0
                                ? 'Saves and add-to-cart taps show up here the moment a shopper makes one.'
                                : 'Try a different name, phone number or product.'
                        }
                        columns={[
                            {
                                key: 'what',
                                header: 'Signal',
                                render: (row) => (
                                    <span className="inline-flex items-center gap-2">
                                        <span
                                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                                            style={{
                                                backgroundColor:
                                                    row.kind === 'wishlist'
                                                        ? Theme.colors.primaryLight
                                                        : Theme.colors.surfaceAlt,
                                                color:
                                                    row.kind === 'wishlist'
                                                        ? Theme.colors.primaryDark
                                                        : Theme.colors.text,
                                            }}
                                        >
                                            {row.kind === 'wishlist' ? (
                                                <Heart size={13} />
                                            ) : (
                                                <ShoppingCart size={13} />
                                            )}
                                        </span>
                                        <span className="text-[12px] font-semibold">
                                            {row.kind === 'wishlist'
                                                ? 'Saved to wishlist'
                                                : `Added ${row.qty} unit${row.qty === 1 ? '' : 's'}`}
                                        </span>
                                    </span>
                                ),
                            },
                            {
                                key: 'shopper',
                                header: 'Shopper',
                                render: (row) => (
                                    <div className="min-w-0">
                                        <p className="truncate text-[12.5px] font-semibold">{row.customer}</p>
                                        {row.phone && (
                                            <p
                                                className="text-[11px]"
                                                style={{ color: Theme.colors.textMuted }}
                                            >
                                                {row.phone}
                                            </p>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: 'product',
                                header: 'Product',
                                render: (row) => (
                                    <span className="block max-w-[260px] truncate text-[12.5px]">{row.name}</span>
                                ),
                            },
                            {
                                key: 'when',
                                header: 'When',
                                align: 'right',
                                hideBelow: 'sm',
                                render: (row) => (
                                    <span
                                        className="whitespace-nowrap text-[11.5px]"
                                        style={{ color: Theme.colors.textMuted }}
                                    >
                                        {DATE_TIME.format(row.at)}
                                    </span>
                                ),
                            },
                        ]}
                    />
                )}
            </div>

            <Panel className="mt-4 p-4">
                <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                    Both signals are counted per shopper, not per tap: the wishlist keeps one row per shopper per
                    product, and cart interest keeps one row per shopper per product with an <strong>adds</strong>{' '}
                    counter. That is why a person who taps add-to-cart five times still counts as one shopper — and
                    why the unit count, not the tap count, is the number to stock against. Interest ranks saves double,
                    because a save is a deliberate wish while a cart tap is only intent.
                </p>
            </Panel>
        </div>
    );
}
