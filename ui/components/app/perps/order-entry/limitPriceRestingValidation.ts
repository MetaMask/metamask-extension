import type { OrderDirection } from './order-entry.types';

/**
 * Reference price for "market" when validating resting limit orders.
 * Prefer mid (order book); fall back to chart/mark price.
 *
 * @param midPrice - Top-of-book mid price when available
 * @param currentPrice - Mark / last close fallback
 */
export function getLimitOrderReferencePrice(
  midPrice: number | undefined,
  currentPrice: number,
): number {
  if (midPrice !== undefined && midPrice > 0 && Number.isFinite(midPrice)) {
    return midPrice;
  }
  return currentPrice;
}

/**
 * Whether a limit price would rest on the book (not cross and fill immediately).
 * - Long (buy): limit must be strictly below reference (buy below the market).
 * - Short (sell): limit must be strictly above reference (sell above the market).
 *
 * @param direction - Position direction
 * @param limitPrice - Parsed limit price (positive finite)
 * @param referencePrice - Mid or current price
 */
export function isLimitPriceRestingOnBook(
  direction: OrderDirection,
  limitPrice: number,
  referencePrice: number,
): boolean {
  if (
    referencePrice <= 0 ||
    !Number.isFinite(referencePrice) ||
    !Number.isFinite(limitPrice) ||
    limitPrice <= 0
  ) {
    return false;
  }
  if (direction === 'long') {
    return limitPrice < referencePrice;
  }
  return limitPrice > referencePrice;
}
