import { hasPositiveNumericAmount } from './hasPositiveNumericAmount';

type FormatCurrencyWithMinThreshold = (
  value: number,
  currency: string,
) => string;

/**
 * Formats a ramps fiat/fee amount when both amount and currency are usable.
 *
 * @param amount - Raw amount from the mapped activity item.
 * @param currency - ISO currency or fee symbol.
 * @param formatCurrencyWithMinThreshold - Formatter from `useFormatters`.
 * @returns Formatted currency string, or undefined when not displayable.
 */
export function formatRampCurrencyAmount(
  amount: unknown,
  currency: string | undefined,
  formatCurrencyWithMinThreshold: FormatCurrencyWithMinThreshold,
): string | undefined {
  if (!currency || !hasPositiveNumericAmount(amount)) {
    return undefined;
  }
  return formatCurrencyWithMinThreshold(Number(amount), currency);
}
