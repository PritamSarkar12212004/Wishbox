import Theme from '@/assets/Theme/Theme';
import { History, Package } from 'lucide-react';

const orderHistory = [
    { id: '#WB-1042', date: 'Aug 22, 2026', total: '$46.99', status: 'Delivered' },
    { id: '#WB-1038', date: 'Aug 05, 2026', total: '$24.00', status: 'Delivered' },
    { id: '#WB-1027', date: 'Jul 18, 2026', total: '$61.45', status: 'Processing' },
];

function HistoryPage() {
    return (
        <div className="min-h-full px-6 py-10" style={{ backgroundColor: Theme.colors.background }}>
            <div className="flex items-center gap-3 mb-8">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: Theme.colors.secondary }}
                >
                    <History size={22} style={{ color: Theme.colors.text }} />
                </div>
                <h1
                    className="text-3xl font-bold"
                    style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
                >
                    Order History
                </h1>
            </div>
            <div className="max-w-3xl flex flex-col gap-4">
                {orderHistory.map((order) => {
                    const isDelivered = order.status === 'Delivered';
                    return (
                        <div
                            key={order.id}
                            className="p-5 rounded-xl border flex items-center justify-between"
                            style={{
                                backgroundColor: Theme.colors.surface,
                                borderColor: Theme.colors.border,
                                boxShadow: Theme.Shadow?.sm,
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: Theme.colors.secondary }}
                                >
                                    <Package size={20} style={{ color: Theme.colors.text }} />
                                </div>
                                <div>
                                    <p className="font-semibold" style={{ color: Theme.colors.text }}>
                                        {order.id}
                                    </p>
                                    <p className="text-sm" style={{ color: Theme.colors.textMuted }}>
                                        {order.date}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-5">
                                <span style={{ color: Theme.colors.accent }}>{order.total}</span>
                                <span
                                    className="text-xs font-medium px-3 py-1 rounded-full"
                                    style={{
                                        backgroundColor: isDelivered
                                            ? Theme.colors.primaryLight
                                            : Theme.colors.tertiary,
                                        color: isDelivered ? Theme.colors.primaryDark : Theme.colors.accentDark,
                                    }}
                                >
                                    {order.status}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default HistoryPage;
