import type { OrderDirection } from './order-entry.types';

/**
 * Parse a formatted limit-price string (may contain commas and "$") into a
 * numeric value. Returns `NaN` when the input is empty or otherwise
 * non-numeric.
 * @param raw
 */
export function parseLimitPrice(raw: string): number {
  const cleaned = raw.replaceAll(',', '').replaceAll('$', '');
  if (!cleaned) {
    return Number.NaN;
  }
  return Number.parseFloat(cleaned);
}

/**
 * Determine whether the given limit price is "unfavorable" relative to the
 * current market price and the order direction.
 *
 * A long order with a limit price above the current price is unfavorable
 * (the user would pay more than market). A short order with a limit price
 * below the current price is unfavorable (the user would sell for less than
 * market). Returns `false` when any input is missing or the parsed price
 * is zero or negative.
 *
 * @param limitPrice - Raw limit price string (may contain commas / "$")
 * @param currentPrice - Current market price
 * @param direction - Order direction ("long" or "short")
 */
export function isLimitPriceUnfavorable(
  limitPrice: string,
  currentPrice: number,
  direction: OrderDirection,
): boolean {
  if (!limitPrice || !currentPrice || currentPrice <= 0) {
    return false;
  }
  const parsed = parseLimitPrice(limitPrice);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return false;
  }
  if (direction === 'long' && parsed > currentPrice) {
    return true;
  }
  if (direction === 'short' && parsed < currentPrice) {
    return true;
  }
  return false;
}

/**
 * Determine whether the current market price is at or beyond the estimated
 * liquidation price for the given direction.
 *
 * For longs the current price being at or below the liquidation price is
 * considered near-liquidation. For shorts it is the current price being at
 * or above the liquidation price. Returns `false` when liquidation price is
 * unavailable or any input is missing / non-positive.
 *
 * @param currentPrice - Current market price
 * @param liquidationPrice - Estimated liquidation price (may be null)
 * @param direction - Order direction ("long" or "short")
 */
export function isNearLiquidationPrice(
  currentPrice: number,
  liquidationPrice: number | null | undefined,
  direction: OrderDirection,
): boolean {
  if (
    liquidationPrice === null ||
    liquidationPrice === undefined ||
    liquidationPrice <= 0
  ) {
    return false;
  }
  if (!currentPrice || currentPrice <= 0) {
    return false;
  }
  return direction === 'long'
    ? currentPrice <= liquidationPrice
    : currentPrice >= liquidationPrice;
}
