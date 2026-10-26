import { Construction, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import Theme from '@/assets/Theme/Theme';
import adminConst from '../consts/adminConst';

/**
 * Placeholder for a panel section that is switched off while it is rebuilt.
 *
 * Orders, Shipping and Payments are listed in `UNDER_DEVELOPMENT_SECTIONS`, so
 * their routes render this instead of a half-finished screen and the sidebar
 * shows them greyed out. Nothing on those pages can be reached or changed until
 * the section is taken off that list.
 */
export default function AdminUnderDevelopment({ section }: { section: string }) {
    return (
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-12 text-center">
            <span
                className="grid h-12 w-12 place-items-center rounded-2xl"
                style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.accentDark }}
            >
                <Construction size={22} />
            </span>

            <p
                className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ color: Theme.colors.textMuted }}
            >
                Under development
            </p>
            <h1
                className="mt-1 text-xl font-bold"
                style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
            >
                {section} is being rebuilt
            </h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                This section is switched off for now, so nothing here can be changed by mistake. It
                reopens as soon as the new {section.toLowerCase()} flow is ready.
            </p>

            <Link
                to={adminConst.route.adminPage}
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
                style={{ backgroundColor: Theme.colors.primaryDark, boxShadow: Theme.Shadow.sm }}
            >
                <LayoutDashboard size={15} />
                Back to dashboard
            </Link>
        </div>
    );
}
