import { IconName } from '@metamask/design-system-react';

const PAYMENT_TYPE_ICONS: Record<string, IconName> = {
  'apple-pay': IconName.AppleLogo,
  'google-pay': IconName.Wallet,
  'debit-credit-card': IconName.Card,
  'credit-debit-card': IconName.Card,
  'bank-transfer': IconName.Bank,
  'sepa-bank-transfer': IconName.Bank,
  'ach-bank-transfer': IconName.Bank,
  wallet: IconName.Wallet,
  cash: IconName.Cash,
};

const PAYMENT_ICON_FIELD_ICONS: Record<string, IconName> = {
  apple: IconName.AppleLogo,
  card: IconName.Card,
  bank: IconName.Bank,
  wallet: IconName.Wallet,
  cash: IconName.Cash,
};

/**
 * Resolves a design-system icon for a ramps payment method.
 *
 * Prefers `paymentType`, then falls back to the `icon` field string.
 *
 * @param paymentType - API payment type id.
 * @param icon - Optional icon identifier from the payment method payload.
 * @returns Matching `IconName`, defaulting to wallet.
 */
export function getPaymentMethodIconName(
  paymentType?: string | null,
  icon?: string | null,
): IconName {
  if (paymentType) {
    const typeIcon = PAYMENT_TYPE_ICONS[paymentType.toLowerCase()];
    if (typeIcon) {
      return typeIcon;
    }
  }

  if (icon) {
    const fieldIcon = PAYMENT_ICON_FIELD_ICONS[icon.toLowerCase()];
    if (fieldIcon) {
      return fieldIcon;
    }
  }

  return IconName.Wallet;
}
