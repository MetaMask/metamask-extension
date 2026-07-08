import type { OrderBookData, OrderBookLevel } from '@metamask/perps-controller';
import {
  formatPerpsFiat,
  formatLargeNumber,
  PRICE_RANGES_UNIVERSAL,
} from '../../../../../shared/lib/perps-formatters';
import type {
  OrderBookListCurrency,
  OrderBookListMetric,
} from './order-book.types';

/** Maximum number of price levels rendered per side. */
export const ORDER_BOOK_DISPLAY_LEVELS = 11;

/**
 * Calculate dynamic price-grouping options based on the asset's mid price.
 * Uses a "1-2-5 per decade" scale anchored to the price magnitude, mirroring
 * the mobile order book.
 *
 * @param midPrice - Current mid price of the asset.
 * @returns Array of grouping increments suitable for the price magnitude.
 * @example
 * calculateGroupingOptions(87000) → [1, 2, 5, 10, 100, 1000]
 * calculateGroupingOptions(33)    → [0.001, 0.002, 0.005, 0.01, 0.1, 1]
 */
export function calculateGroupingOptions(midPrice: number): number[] {
  if (!Number.isFinite(midPrice) || midPrice <= 0) {
    return [0.01, 0.1, 1];
  }

  const k = Math.floor(Math.log10(midPrice));
  const base = 10 ** (k - 4);
  const multipliers = [1, 2, 5, 10, 100, 1000];

  return multipliers.map((m) => base * m);
}

/**
 * Format a grouping increment for display (e.g. "0.001", "1", "1,000").
 *
 * @param value - The grouping increment.
 * @returns Human-readable label.
 */
export function formatGroupingLabel(value: number): string {
  if (value >= 1) {
    return value.toLocaleString('en-US');
  }
  const decimals = Math.max(0, Math.ceil(-Math.log10(value)));
  return value.toFixed(decimals);
}

/**
 * Select a sensible default grouping option (a middle-of-the-road increment).
 *
 * @param options - Available grouping options.
 * @returns The recommended default grouping value.
 */
export function selectDefaultGrouping(options: number[]): number {
  return (
    options[3] ?? options[Math.floor(options.length / 2)] ?? options[0] ?? 1
  );
}

/**
 * Aggregate raw order book levels into price buckets of `groupingSize`,
 * summing size/notional and recomputing cumulative totals.
 *
 * @param levels - Raw order book levels from the stream.
 * @param groupingSize - Price bucket size (e.g. 10 groups into $10 increments).
 * @param side - 'bid' rounds price down to the bucket, 'ask' rounds up.
 * @returns Aggregated levels sorted best-price-first.
 */
export function aggregateOrderBookLevels(
  levels: OrderBookLevel[],
  groupingSize: number,
  side: 'bid' | 'ask',
): OrderBookLevel[] {
  if (!levels.length || groupingSize <= 0) {
    return levels;
  }

  const buckets = new Map<
    number,
    { size: number; notional: number; price: number }
  >();

  for (const level of levels) {
    const price = Number.parseFloat(level.price);
    const size = Number.parseFloat(level.size);
    const notional = Number.parseFloat(level.notional);
    if (!Number.isFinite(price)) {
      continue;
    }

    const bucketPrice =
      side === 'bid'
        ? Math.floor(price / groupingSize) * groupingSize
        : Math.ceil(price / groupingSize) * groupingSize;

    const existing = buckets.get(bucketPrice);
    if (existing) {
      existing.size += size;
      existing.notional += notional;
    } else {
      buckets.set(bucketPrice, { size, notional, price: bucketPrice });
    }
  }

  const sortedBuckets = Array.from(buckets.values()).sort((a, b) =>
    side === 'bid' ? b.price - a.price : a.price - b.price,
  );

  let cumulativeSize = 0;
  let cumulativeNotional = 0;

  return sortedBuckets.map((bucket) => {
    cumulativeSize += bucket.size;
    cumulativeNotional += bucket.notional;
    return {
      price: bucket.price.toString(),
      size: bucket.size.toString(),
      total: cumulativeSize.toString(),
      notional: bucket.notional.toFixed(2),
      totalNotional: cumulativeNotional.toFixed(2),
    };
  });
}

/**
 * Apply price grouping to an order book, returning trimmed bid/ask ladders and
 * a recomputed `maxTotal` used to scale the depth bars.
 *
 * @param orderBook - Raw order book data.
 * @param grouping - Selected price grouping increment (null = no aggregation).
 * @returns Grouped bids/asks (already limited to the display depth) and maxTotal.
 */
export function groupOrderBook(
  orderBook: OrderBookData,
  grouping: number | null,
): { bids: OrderBookLevel[]; asks: OrderBookLevel[]; maxTotal: number } {
  const bids = grouping
    ? aggregateOrderBookLevels(orderBook.bids, grouping, 'bid')
    : orderBook.bids;
  const asks = grouping
    ? aggregateOrderBookLevels(orderBook.asks, grouping, 'ask')
    : orderBook.asks;

  const trimmedBids = bids.slice(0, ORDER_BOOK_DISPLAY_LEVELS);
  const trimmedAsks = asks.slice(0, ORDER_BOOK_DISPLAY_LEVELS);

  const maxTotal = [...trimmedBids, ...trimmedAsks].reduce((max, level) => {
    const total = Number.parseFloat(level.total);
    return Number.isFinite(total) && total > max ? total : max;
  }, 0);

  return { bids: trimmedBids, asks: trimmedAsks, maxTotal };
}

/**
 * Depth-bar width (0-100) for a level relative to the deepest level.
 *
 * @param level - Order book level.
 * @param maxTotal - Maximum cumulative size across all displayed levels.
 * @returns Width as a percentage.
 */
export function getDepthWidth(level: OrderBookLevel, maxTotal: number): number {
  if (!Number.isFinite(maxTotal) || maxTotal <= 0) {
    return 0;
  }
  const total = Number.parseFloat(level.total);
  return Math.min((total / maxTotal) * 100, 100);
}

/**
 * Format a USD value with compact notation for large numbers.
 *
 * @param value - USD amount.
 * @returns Formatted string (e.g. "$55.4M", "$121K", "$1,234.00").
 */
function formatUsd(value: number): string {
  if (!Number.isFinite(value)) {
    return '-';
  }
  if (value >= 1_000_000) {
    return `$${formatLargeNumber(value, { decimals: 1 })}`;
  }
  if (value >= 10_000) {
    return `$${formatLargeNumber(value, { decimals: 0 })}`;
  }
  return formatPerpsFiat(value, { ranges: PRICE_RANGES_UNIVERSAL });
}

/**
 * Format a base-asset amount with sensible precision.
 *
 * @param value - Base-asset amount.
 * @returns Formatted string.
 */
function formatBase(value: number): string {
  if (!Number.isFinite(value)) {
    return '-';
  }
  if (value >= 1) {
    return value.toFixed(4);
  }
  return value.toFixed(6);
}

/**
 * Format the value shown in the metric column based on the selected currency
 * (base/USD) and metric (per-level size or cumulative total).
 *
 * @param level - Order book level.
 * @param currency - Selected currency ('base' | 'usd').
 * @param metric - Selected metric ('size' | 'total').
 * @returns Formatted column value.
 */
export function formatColumnValue(
  level: OrderBookLevel,
  currency: OrderBookListCurrency,
  metric: OrderBookListMetric,
): string {
  if (currency === 'usd') {
    const raw =
      metric === 'total' ? level.totalNotional : level.notional;
    return formatUsd(Number.parseFloat(raw));
  }
  const raw = metric === 'total' ? level.total : level.size;
  return formatBase(Number.parseFloat(raw));
}

/**
 * Compute the buy/sell depth ratio (percentages summing to 100) from the
 * cumulative totals at the deepest displayed level on each side.
 *
 * @param bids - Displayed bid levels.
 * @param asks - Displayed ask levels.
 * @returns Buy and sell percentages (integers), or null when depth is absent.
 */
export function getDepthRatio(
  bids: OrderBookLevel[],
  asks: OrderBookLevel[],
): { buyPercent: number; sellPercent: number } | null {
  const bidDepth = bids.length
    ? Number.parseFloat(bids[bids.length - 1].total)
    : 0;
  const askDepth = asks.length
    ? Number.parseFloat(asks[asks.length - 1].total)
    : 0;
  const totalDepth = bidDepth + askDepth;
  if (!Number.isFinite(totalDepth) || totalDepth <= 0) {
    return null;
  }
  const buyPercent = Math.round((bidDepth / totalDepth) * 100);
  return { buyPercent, sellPercent: 100 - buyPercent };
}
