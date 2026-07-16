import type { Provider } from '@metamask/ramps-controller';
import type { useI18nContext } from '../../../hooks/useI18nContext';
import { getProviderBuyLimit } from '../payment-method/utils/format-payment-method-limits';
import { isProviderLimitError } from './isProviderLimitError';

type TranslateFn = ReturnType<typeof useI18nContext>;
type FormatCurrency = (amount: number, currency: string) => string;

type GetProviderLimitMessageArgs = {
  provider: Provider | null | undefined;
  fiatCurrency: string | null | undefined;
  paymentMethodId: string | null | undefined;
  amount: number;
  currency: string;
  formatCurrency: FormatCurrency;
  t: TranslateFn;
  /**
   * Raw per-provider error string from the quotes response. Used as a fallback
   * when structured limits aren't published for the provider.
   */
  backendError?: string | null;
};

/**
 * Resolves the user-facing limit message for a provider that can't quote.
 *
 * Prefers structured provider limits, then falls back to backend limit strings.
 * Returns null when it isn't a limit situation.
 *
 * @param args - Limit message resolution inputs.
 * @param args.provider
 * @param args.fiatCurrency
 * @param args.paymentMethodId
 * @param args.amount
 * @param args.currency
 * @param args.formatCurrency
 * @param args.t
 * @param args.backendError
 * @returns The localized or backend limit message, or null.
 */
export function getProviderLimitMessage({
  provider,
  fiatCurrency,
  paymentMethodId,
  amount,
  currency,
  formatCurrency,
  t,
  backendError,
}: GetProviderLimitMessageArgs): string | null {
  if (amount > 0) {
    const buyLimit = getProviderBuyLimit(
      provider,
      fiatCurrency,
      paymentMethodId,
    );

    if (buyLimit) {
      if (Number.isFinite(buyLimit.minAmount) && amount < buyLimit.minAmount) {
        return t('rampsMinPurchaseLimit', [
          formatCurrency(buyLimit.minAmount, currency),
        ]);
      }

      if (Number.isFinite(buyLimit.maxAmount) && amount > buyLimit.maxAmount) {
        return t('rampsMaxPurchaseLimit', [
          formatCurrency(buyLimit.maxAmount, currency),
        ]);
      }
    }
  }

  if (isProviderLimitError(backendError)) {
    return backendError;
  }

  return null;
}
