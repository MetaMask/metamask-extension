import { calculatePositionSize } from '@metamask/perps-controller';
import type { OrderFormState } from './order-entry.types';

const isDigit = (char: string): boolean => char >= '0' && char <= '9';

/**
 * Formats a number for use in editable input fields. Always uses "." as the
 * decimal separator regardless of the user's locale, ensuring compatibility
 * with isUnsignedDecimalInput validation.
 * @param value - The number to format
 * @param maximumFractionDigits - Maximum fractional digits (default 6)
 */
export const formatNumberForInput = (
  value: number,
  maximumFractionDigits = 6,
): string =>
  new Intl.NumberFormat('en-US', {
    useGrouping: false,
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);

/**
 * Linear-time digit check for integer-style inputs.
 * @param value
 */
export const isDigitsOnlyInput = (value: string): boolean => {
  for (const char of value) {
    if (!isDigit(char)) {
      return false;
    }
  }
  return true;
};

/**
 * Linear-time unsigned decimal validation with optional single decimal point.
 * Accepts intermediate input states like ".".
 * @param value
 */
export const isUnsignedDecimalInput = (value: string): boolean => {
  let seenDecimal = false;
  for (const char of value) {
    if (char === '.') {
      if (seenDecimal) {
        return false;
      }
      seenDecimal = true;
      continue;
    }
    if (!isDigit(char)) {
      return false;
    }
  }
  return true;
};

/**
 * Size, in asset units, of the order the form describes. The amount field is
 * the USD notional (leverage is already applied), so the size is that notional
 * divided by the price the order fills at: the limit price for a limit order,
 * the current price otherwise. Rounded to the asset's size grid by the
 * controller, the same way placement sizes it.
 *
 * @param formState - Order form amount, type and limit price
 * @param currentPrice - Current asset price in USD
 * @param szDecimals - The asset's size decimal precision
 * @returns Position size in asset units, or undefined without a positive
 * amount and fill price
 */
export function getOrderFormPositionSize(
  formState: Pick<OrderFormState, 'amount' | 'type' | 'limitPrice'>,
  currentPrice: number,
  szDecimals: number,
): string | undefined {
  const amount = formState.amount.replaceAll(',', '');
  const limitPrice =
    formState.type === 'limit'
      ? Number.parseFloat(formState.limitPrice.replaceAll(/[$,]/gu, ''))
      : Number.NaN;
  const price =
    Number.isFinite(limitPrice) && limitPrice > 0 ? limitPrice : currentPrice;
  if (
    !(Number.parseFloat(amount) > 0) ||
    !Number.isFinite(price) ||
    !(price > 0)
  ) {
    return undefined;
  }
  return calculatePositionSize({ amount, price, szDecimals });
}
