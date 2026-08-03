import type { Provider } from '@metamask/ramps-controller';
import type { useI18nContext } from '../../../../hooks/useI18nContext';

export type ProviderBuyLimit = {
  minAmount: number;
  maxAmount: number;
  feeFixedRate?: number;
  feeDynamicRate?: number;
};

/**
 * Looks up structured buy limits for a provider + fiat + payment method.
 *
 * @param provider - Selected ramp provider.
 * @param fiatCurrency - Fiat currency short code (e.g. USD).
 * @param paymentMethodId - Payment method id.
 * @returns Buy limit when published by the providers endpoint.
 */
export function getProviderBuyLimit(
  provider: Provider | null | undefined,
  fiatCurrency: string | null | undefined,
  paymentMethodId: string | null | undefined,
): ProviderBuyLimit | undefined {
  if (!provider || !fiatCurrency || !paymentMethodId) {
    return undefined;
  }

  return provider.limits?.fiat?.[fiatCurrency.toLowerCase()]?.[paymentMethodId];
}

type TranslateFn = ReturnType<typeof useI18nContext>;

/**
 * Formats a provider min/max buy limit for payment method list display.
 *
 * @param limit - Structured buy limit, when available.
 * @param formatFiat - Fiat amount formatter.
 * @param t - i18n translate function.
 * @returns Localized limit label, or null when limit data is missing.
 */
export function formatPaymentMethodLimits(
  limit: ProviderBuyLimit | undefined,
  formatFiat: (amount: number) => string,
  t: TranslateFn,
): string | null {
  if (!limit) {
    return null;
  }

  const hasMin = Number.isFinite(limit.minAmount);
  const hasMax = Number.isFinite(limit.maxAmount);

  // Figma shows the ceiling only ("$500 limit"); the row pairs this with the
  // delay on a single line, so a min–max range does not fit.
  if (hasMax) {
    return t('rampsPaymentMethodLimit', [formatFiat(limit.maxAmount)]);
  }

  if (hasMin) {
    return t('rampsPaymentMethodMinLimit', [formatFiat(limit.minAmount)]);
  }

  return null;
}
