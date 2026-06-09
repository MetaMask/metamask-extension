import {
  BASIS_POINTS_DIVISOR,
  type OrderBookData,
} from '@metamask/perps-controller';

export type EstimatedSlippageParams = {
  /** Live order book snapshot (typically from usePerpsLiveOrderBook). */
  orderBook: OrderBookData | null;
  /** USD notional to fill. */
  sizeUsd: number;
  /** true = BUY (sweeps asks), false = SELL (sweeps bids). */
  isBuy: boolean;
};

/**
 * Estimate slippage in basis points for a market order of `sizeUsd` against
 * the current L2 book. Returns `null` when the book is missing or too shallow.
 *
 * @param params - Order book snapshot, USD notional, and direction.
 * @param params.orderBook
 * @param params.sizeUsd
 * @param params.isBuy
 * @returns Estimated slippage in basis points (always non-negative) or null.
 */
export function calculateEstimatedSlippageBps({
  orderBook,
  sizeUsd,
  isBuy,
}: EstimatedSlippageParams): number | null {
  if (!orderBook || !(sizeUsd > 0)) {
    return null;
  }

  const midPrice = Number(orderBook.midPrice);
  if (!Number.isFinite(midPrice) || midPrice <= 0) {
    return null;
  }

  const levels = isBuy ? orderBook.asks : orderBook.bids;
  if (!levels || levels.length === 0) {
    return null;
  }

  const targetBaseSize = sizeUsd / midPrice;
  if (!Number.isFinite(targetBaseSize) || targetBaseSize <= 0) {
    return null;
  }

  let filledBaseSize = 0;
  let weightedPriceSum = 0;

  for (const level of levels) {
    const price = Number(level.price);
    const size = Number(level.size);
    if (!Number.isFinite(price) || !Number.isFinite(size) || size <= 0) {
      continue;
    }

    const remainingBase = targetBaseSize - filledBaseSize;

    if (remainingBase <= size) {
      weightedPriceSum += remainingBase * price;
      filledBaseSize += remainingBase;
      break;
    }

    weightedPriceSum += size * price;
    filledBaseSize += size;
  }

  if (filledBaseSize < targetBaseSize || filledBaseSize <= 0) {
    return null;
  }

  const vwap = weightedPriceSum / filledBaseSize;
  const slippageBps =
    ((vwap - midPrice) / midPrice) * BASIS_POINTS_DIVISOR * (isBuy ? 1 : -1);
  return Math.max(0, slippageBps);
}
