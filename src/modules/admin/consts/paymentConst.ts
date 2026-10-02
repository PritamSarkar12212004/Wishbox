import Theme from '@/assets/Theme/Theme';
import type { PaymentMethod } from '../data/adminData';

/** One stable colour per rail so every chart and legend agrees. */
export const PAYMENT_COLORS: Record<PaymentMethod, string> = {
    UPI: Theme.colors.primary,
    'Credit Card': Theme.colors.primaryDark,
    'Debit Card': Theme.colors.secondary,
    COD: Theme.colors.gold,
    Wallet: Theme.colors.accent,
};
