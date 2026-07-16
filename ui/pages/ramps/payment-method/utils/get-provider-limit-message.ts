import type { Provider } from '@metamask/ramps-controller';
import type { useI18nContext } from '../../../../hooks/useI18nContext';
import { getProviderBuyLimit } from './format-payment-method-limits';
import { isProviderLimitError } from './is-provider-limit-error';

type TranslateFn = ReturnType<typeof useI18nContext>;

type FormatCurrency = (
  value: number,
  currency: string,
  options?: Intl.NumberFormatOptions,
) => string;

export type GetProviderLimitMessageArgs = {
  provider: Provider | null | undefined;
  fiatCurrency: string | null | undefined;
  paymentMethodId: string | null | undefined;
  amount: number;
  currency: string;
  formatCurrency: FormatCurrency;
  t: TranslateFn;
  /**
   * Raw per-provider error from the quotes response. Used when structured
   * limits are not published for the provider.
   */
  backendError?: string | null;
};

/**
 * Resolves the user-facing limit message for a payment method that cannot quote.
 *
 * Prefers structured provider limits so the message is localized. Falls back
 * to the backend English limit string when structured limits are missing.
 * Returns null for non-limit failures so callers can show a generic unavailable
 * message instead of leaking technical errors.
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
 * @returns Localized or backend limit message, or null.
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
      if (
        buyLimit.minAmount !== undefined &&
        buyLimit.minAmount !== null &&
        amount < buyLimit.minAmount
      ) {
        return t('rampsMinPurchaseLimit', [
          formatCurrency(buyLimit.minAmount, currency, {
            currencyDisplay: 'narrowSymbol',
          }),
        ]);
      }

      if (
        buyLimit.maxAmount !== undefined &&
        buyLimit.maxAmount !== null &&
        amount > buyLimit.maxAmount
      ) {
        return t('rampsMaxPurchaseLimit', [
          formatCurrency(buyLimit.maxAmount, currency, {
            currencyDisplay: 'narrowSymbol',
          }),
        ]);
      }
    }
  }

  if (isProviderLimitError(backendError)) {
    return backendError;
  }

  return null;
}
