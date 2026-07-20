import type { Provider } from '@metamask/ramps-controller';
import type { useI18nContext } from '../../../hooks/useI18nContext';
import { getProviderBuyLimit } from '../payment-method/utils/format-payment-method-limits';

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
};

/**
 * Resolves the user-facing limit message for a provider that can't quote.
 *
 * Uses structured provider limits (`limits.fiat[ccy][paymentMethod]`) — the
 * same values the backend enforces — so the message is localized via i18n.
 * Returns null when the amount is within limits or limits aren't published,
 * so the caller can show a generic "Quote unavailable" rather than parsing
 * brittle backend error strings.
 *
 * @param args - Limit message resolution inputs.
 * @param args.provider
 * @param args.fiatCurrency
 * @param args.paymentMethodId
 * @param args.amount
 * @param args.currency
 * @param args.formatCurrency
 * @param args.t
 * @returns The localized limit message, or null.
 */
export function getProviderLimitMessage({
  provider,
  fiatCurrency,
  paymentMethodId,
  amount,
  currency,
  formatCurrency,
  t,
}: GetProviderLimitMessageArgs): string | null {
  if (amount <= 0) {
    return null;
  }

  const buyLimit = getProviderBuyLimit(provider, fiatCurrency, paymentMethodId);

  if (!buyLimit) {
    return null;
  }

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

  return null;
}
