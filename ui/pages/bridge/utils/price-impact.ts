import { formatCurrencyAmount } from './quote';

/**
 * Formats price impact percentage for display.
 *
 * @param priceImpact - The price impact value from the API (in decimal form, e.g., 0.87 = 87%).
 * @returns Formatted price impact string.
 */
export function formatPriceImpactPercentage(
  priceImpact: string | number | undefined | null,
): string {
  if (priceImpact === undefined || priceImpact === null) {
    return '0%';
  }

  const impact = Number(priceImpact);

  if (isNaN(impact) || !impact || impact < 0) {
    return '0%';
  }

  // Convert from decimal to percentage (0.87 -> 87)
  const percentageImpact = impact * 100;

  // If the impact is very small but not zero, show <0.01%
  if (percentageImpact > 0 && percentageImpact < 0.01) {
    return '<0.01%';
  }

  // For values less than 1%, show with 2 decimal places
  if (Math.abs(percentageImpact) < 1) {
    return `${percentageImpact.toFixed(2)}%`;
  }

  // For values between 1% and 10%, show with 1 decimal place
  if (Math.abs(percentageImpact) < 10) {
    return `${percentageImpact.toFixed(1)}%`;
  }

  // For values 10% and above, show with no decimal places
  return `${Math.round(percentageImpact)}%`;
}

/**
 * Returns the fiat price impact for a bridge quote — the difference between
 * the source input fiat amount and the destination output fiat amount,
 * formatted in the user's current currency (e.g. "$4.23", "€3.90").
 *
 * @param activeQuote - The active bridge quote metadata.
 * @param currentCurrency - The user's current display currency (e.g. "usd").
 * @returns Formatted fiat impact string, or `undefined` when either fiat value is unavailable.
 */
export function formatPriceImpactFiat(
  activeQuote:
    | {
        sentAmount?: { valueInCurrency?: string | number | null } | null;
        toTokenAmount?: { valueInCurrency?: string | number | null } | null;
      }
    | null
    | undefined,
  currentCurrency: string,
): string | undefined {
  if (!activeQuote) {
    return undefined;
  }

  const sourceFiat = activeQuote.sentAmount?.valueInCurrency;
  const destFiat = activeQuote.toTokenAmount?.valueInCurrency;

  if (
    sourceFiat === null ||
    sourceFiat === undefined ||
    destFiat === null ||
    destFiat === undefined
  ) {
    return undefined;
  }

  const diff = Math.abs(Number(sourceFiat) - Number(destFiat));
  return formatCurrencyAmount(String(diff), currentCurrency, 2);
}
