import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Store, UserRound } from "lucide-react";
import Theme from "@/assets/Theme/Theme";
import { LOGIN_REASONS } from "@/modules/auth/data/authData";
import { formatPhone } from "@/modules/auth/lib/otp";
import { useIdentity, useIsSignedIn } from "@/modules/auth/store/authStore";
import { loginGate } from "@/modules/auth/store/loginGate";
import { ApiError } from "@/lib/api/client";
import { AdminButton } from "./AdminUI";
import { AdminShellSkeleton } from "./AdminSkeleton";
import AdminUnavailable from "./AdminUnavailable";
import { useAdminSession } from "../api/useAdmin";
import AdminDataProvider from "../providers/AdminDataProvider";

export default function AdminAccess({ children }: { children: ReactNode }) {
  const signedIn = useIsSignedIn();
  const identity = useIdentity();
  const session = useAdminSession();

  if (!signedIn) {
    return <AdminLocked variant="signed-out" />;
  }

  if (session.isPending) {
    return <AdminShellSkeleton />;
  }

  if (session.error) {
    const apiError = session.error instanceof ApiError ? session.error : null;
    if (apiError?.isNetworkError) {
      return (
        <AdminUnavailable
          error={session.error}
          onRetry={() => void session.refetch()}
        />
      );
    }
    return (
      <AdminLocked
        variant="forbidden"
        phone={identity ? formatPhone(identity.phone) : undefined}
      />
    );
  }

  if (!session.data?.isAdmin) {
    return (
      <AdminLocked
        variant="forbidden"
        phone={identity ? formatPhone(identity.phone) : undefined}
      />
    );
  }

  return <AdminDataProvider>{children}</AdminDataProvider>;
}

type LockedVariant = "signed-out" | "forbidden";

function AdminLocked({
  variant,
  phone,
}: {
  variant: LockedVariant;
  phone?: string;
}) {
  const signedOut = variant === "signed-out";

  return (
    <div
      className="grid min-h-screen place-items-center px-4"
      style={{
        backgroundColor: Theme.colors.background,
        fontFamily: Theme.Typography.fontFamily,
      }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p
            className="text-2xl font-bold"
            style={{
              fontFamily: Theme.Typography.headingFamily,
              color: Theme.colors.primaryDark,
            }}
          >
            WishBox
          </p>
          <p
            className="mt-1 text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: Theme.colors.textMuted }}
          >
            Admin panel
          </p>
        </div>

        <div
          className="mt-6 rounded-2xl border p-6 text-center"
          style={{
            backgroundColor: Theme.colors.surface,
            borderColor: Theme.colors.border,
            boxShadow: Theme.Shadow.md,
          }}
        >
          <span
            className="mx-auto grid h-10 w-10 place-items-center rounded-full"
            style={{
              backgroundColor: Theme.colors.surfaceAlt,
              color: Theme.colors.primaryDark,
            }}
          >
            {signedOut ? <UserRound size={18} /> : <ShieldAlert size={18} />}
          </span>

          <p
            className="mt-3 text-sm font-bold"
            style={{ color: Theme.colors.text }}
          >
            {signedOut
              ? "Sign in to open the panel"
              : "This account is not an admin"}
          </p>
          <p
            className="mt-1.5 text-xs leading-relaxed"
            style={{ color: Theme.colors.textMuted }}
          >
            {signedOut
              ? "The admin panel runs on the same account as the storefront. Sign in with your WhatsApp number and we will take it from there."
              : `${phone ? `${phone} is` : "This number is"} not on the admin list. Ask an owner to add it to ADMIN_PHONES on the server.`}
          </p>

          {signedOut ? (
            <AdminButton
              variant="primary"
              className="mt-4 h-10 w-full"
              onClick={() =>
                loginGate.require(undefined, LOGIN_REASONS.account)
              }
            >
              <UserRound size={14} />
              Sign in
            </AdminButton>
          ) : null}

          <Link
            to="/"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors hover:opacity-70"
            style={{ color: Theme.colors.textLight }}
          >
            <Store size={13} />
            Back to storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
