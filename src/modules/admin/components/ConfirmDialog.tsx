import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminButton } from './AdminUI';

/**
 * Confirmation gate for the irreversible admin actions (approve / cancel).
 *
 * The confirm button sits in a busy state until the caller resolves, so a double
 * click can never fire the same action twice.
 */
export default function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    confirmVariant = 'primary',
    cancelLabel = 'Cancel',
    busy = false,
    children,
    onConfirm,
    onClose,
}: {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel: string;
    confirmVariant?: 'primary' | 'danger';
    cancelLabel?: string;
    busy?: boolean;
    children?: ReactNode;
    onConfirm: () => void;
    onClose: () => void;
}) {
    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next && !busy) onClose();
            }}
        >
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold">{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>

                {children}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <AdminButton onClick={onClose} disabled={busy}>
                        {cancelLabel}
                    </AdminButton>
                    <AdminButton variant={confirmVariant} onClick={onConfirm} disabled={busy}>
                        {busy ? 'Working…' : confirmLabel}
                    </AdminButton>
                </div>
            </DialogContent>
        </Dialog>
    );
}
