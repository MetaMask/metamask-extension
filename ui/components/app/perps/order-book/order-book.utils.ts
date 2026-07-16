import type { OrderBookData, OrderBookLevel } from '@metamask/perps-controller';
import { PERFORMANCE_CONFIG } from '@metamask/perps-controller';
import {
  formatPerpsFiat,
  formatPositionSize,
  formatLargeNumber,
  PRICE_RANGES_UNIVERSAL,
  PERPS_FALLBACK_DATA_DISPLAY,
  PERPS_MAX_PRICE_DECIMALS,
} from '../../../../../shared/lib/perps-formatters';
import type {
  OrderBookListCurrency,
  OrderBookListMetric,
} from './order-book.types';

/**
 * Maximum number of price levels rendered per side. Reuses the shared
 * order-book stream depth that feeds this component so the display depth can
 * never drift from the subscribed book depth.
 */
export const ORDER_BOOK_DISPLAY_LEVELS =
  PERFORMANCE_CONFIG.SlippageEstimateBookLevels;

/**
 * Levels requested from (and rendered for) the server-aggregated order-book
 * stream. Hyperliquid returns at most ~20 levels per side when aggregating with
 * `nSigFigs`, so we request and display that depth to fill the panel.
 */
export const ORDER_BOOK_AGGREGATED_LEVELS = 20;

/** Server-side aggregation parameters for the Hyperliquid L2Book stream. */
export type OrderBookAggregationParams = {
  nSigFigs: 2 | 3 | 4 | 5;
  mantissa?: 2 | 5;
};

/**
 * Map a display grouping increment + current price to Hyperliquid's server-side
 * L2Book aggregation parameters (`nSigFigs`/`mantissa`), mirroring the mobile
 * order book. Server aggregation lets a coarse grouping (e.g. $10) span the full
 * book depth instead of collapsing the handful of raw levels into one bucket.
 *
 * `nSigFigs` controls how many significant figures of the price are kept
 * (2-5); `mantissa` (only meaningful at 5 sig figs) refines the step to 2x/5x.
 *
 * @param grouping - Selected display grouping increment.
 * @param price - Current mid price of the asset.
 * @returns Aggregation params to pass to the order-book stream.
 */
export function calculateAggregationParams(
  grouping: number,
  price: number,
): OrderBookAggregationParams {
  // Guard against inputs that would make Math.log10 return -Infinity / NaN.
  if (
    !Number.isFinite(price) ||
    !Number.isFinite(grouping) ||
    price <= 0 ||
    grouping <= 0
  ) {
    return { nSigFigs: 5 };
  }

  const priceMagnitude = Math.floor(Math.log10(price));
  const groupingMagnitude = Math.floor(Math.log10(grouping));
  const baseNSigFigs = priceMagnitude - groupingMagnitude + 1;

  if (baseNSigFigs >= 5) {
    const firstDigit = Math.floor(grouping / 10 ** groupingMagnitude);
    if (firstDigit <= 1) {
      return { nSigFigs: 5 };
    }
    return { nSigFigs: 5, mantissa: firstDigit <= 2 ? 2 : 5 };
  }

  const clampedNSigFigs = Math.max(2, Math.min(5, baseNSigFigs)) as
    | 2
    | 3
    | 4
    | 5;
  return { nSigFigs: clampedNSigFigs };
}

/**
 * Grouping-ladder shape (a "1-2-5 per decade" scale anchored to the price
 * magnitude, mirroring the mobile order book). The decade offset shifts the
 * ladder down so the finest increment sits a few decades below the price.
 */
const GROUPING_DECADE_OFFSET = 4;
const GROUPING_MULTIPLIERS = [1, 2, 5, 10, 100, 1000] as const;

/** Default grouping is the 4th (index 3) option: a mid-range increment. */
const DEFAULT_GROUPING_INDEX = 3;

/** Hyperliquid caps price precision; reuse the shared limit as the single source of truth. */
const MAX_PRICE_DECIMALS = PERPS_MAX_PRICE_DECIMALS;

/** Compact-notation thresholds for USD amounts. */
const USD_COMPACT_MILLIONS_THRESHOLD = 1_000_000;
const USD_COMPACT_THOUSANDS_THRESHOLD = 10_000;

/** Decimal places kept when rendering the spread as a percentage. */
const SPREAD_PERCENT_DECIMALS = 3;

/** Shown when a value has not loaded / cannot be parsed. */
const ORDER_BOOK_FALLBACK_DISPLAY = PERPS_FALLBACK_DATA_DISPLAY;

/** Draggable divider width bounds (percentage of the body), used by the page. */
export const ORDER_BOOK_DEFAULT_WIDTH_PCT = 33;
export const ORDER_BOOK_MIN_WIDTH_PCT = 22;
export const ORDER_BOOK_MAX_WIDTH_PCT = 60;

/**
 * Pixel floors for the split layout. In the narrow (~360px) extension popup the
 * percentage widths alone would squeeze either side below a usable size, so both
 * panes get a pixel minimum (only applied while the book is open); the body
 * scrolls horizontally if the popup cannot fit both floors.
 */
/** Minimum readable width for the order-book panel (fits both columns). */
export const ORDER_BOOK_MIN_WIDTH_PX = 140;
/** Minimum usable width for the order-entry form beside the book. */
export const ORDER_BOOK_FORM_MIN_WIDTH_PX = 224;
/** Width of the draggable divider (Tailwind `w-0.5` = 2px). */
export const ORDER_BOOK_DIVIDER_WIDTH_PX = 2;

/**
 * Calculate dynamic price-grouping options based on the asset's mid price.
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

  const magnitude = Math.floor(Math.log10(midPrice));
  const base = 10 ** (magnitude - GROUPING_DECADE_OFFSET);

  // Clamp every increment to the max price precision and de-duplicate: for very
  // low-priced assets the raw ladder can produce increments below 1e-6 that
  // would collapse to 0 once rounded to the price cap.
  const options = GROUPING_MULTIPLIERS.map((multiplier) =>
    Number((base * multiplier).toFixed(MAX_PRICE_DECIMALS)),
  ).filter((value) => value > 0);
  const deduped = Array.from(new Set(options));

  return deduped.length ? deduped : [10 ** -MAX_PRICE_DECIMALS];
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
  const decimals = Math.min(
    MAX_PRICE_DECIMALS,
    Math.max(0, Math.ceil(-Math.log10(value))),
  );
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Select a sensible default grouping option (a middle-of-the-road increment).
 *
 * @param options - Available grouping options.
 * @returns The recommended default grouping value.
 */
export function selectDefaultGrouping(options: number[]): number {
  return (
    options[DEFAULT_GROUPING_INDEX] ??
    options[Math.floor(options.length / 2)] ??
    options[0] ??
    1
  );
}

/**
 * Number of decimal places implied by a grouping increment, capped at the
 * Hyperliquid price-precision limit. Used to build stable (non-floating-point)
 * bucket keys so equivalent buckets never split due to binary rounding drift.
 *
 * @param groupingSize - Price bucket size.
 * @returns Decimal places to normalize bucket prices to.
 */
function getGroupingDecimals(groupingSize: number): number {
  if (!Number.isFinite(groupingSize) || groupingSize >= 1) {
    return 0;
  }
  return Math.min(MAX_PRICE_DECIMALS, Math.ceil(-Math.log10(groupingSize)));
}

/**
 * Aggregate raw order book levels into price buckets of `groupingSize`,
 * summing size/notional and recomputing cumulative totals. Full numeric
 * precision is preserved through aggregation; rounding happens only at display
 * time via the formatters below.
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
  if (!levels.length || !Number.isFinite(groupingSize) || groupingSize <= 0) {
    return levels;
  }

  const priceDecimals = getGroupingDecimals(groupingSize);
  const buckets = new Map<
    string,
    { size: number; notional: number; price: number }
  >();

  for (const level of levels) {
    const price = Number.parseFloat(level.price);
    if (!Number.isFinite(price)) {
      continue;
    }
    const size = Number.parseFloat(level.size);
    const notional = Number.parseFloat(level.notional);
    // Skip malformed levels entirely rather than coercing to 0, so a bad row
    // never contributes phantom zero depth to a bucket / cumulative total.
    if (!Number.isFinite(size) || !Number.isFinite(notional)) {
      continue;
    }

    const bucketPrice =
      side === 'bid'
        ? Math.floor(price / groupingSize) * groupingSize
        : Math.ceil(price / groupingSize) * groupingSize;
    const key = bucketPrice.toFixed(priceDecimals);

    const existing = buckets.get(key);
    if (existing) {
      existing.size += size;
      existing.notional += notional;
    } else {
      buckets.set(key, { size, notional, price: Number.parseFloat(key) });
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
      notional: bucket.notional.toString(),
      totalNotional: cumulativeNotional.toString(),
    };
  });
}

/**
 * Apply price grouping to an order book, returning trimmed bid/ask ladders and
 * a recomputed `maxTotal` used to scale the depth bars.
 *
 * @param orderBook - Raw order book data.
 * @param grouping - Selected price grouping increment (null = no aggregation,
 * e.g. when the stream is already server-aggregated).
 * @param maxLevels - Max rows to render per side (defaults to the raw display depth).
 * @returns Grouped bids/asks (already limited to the display depth) and maxTotal.
 */
export function groupOrderBook(
  orderBook: OrderBookData,
  grouping: number | null,
  maxLevels: number = ORDER_BOOK_DISPLAY_LEVELS,
): { bids: OrderBookLevel[]; asks: OrderBookLevel[]; maxTotal: number } {
  const bids = grouping
    ? aggregateOrderBookLevels(orderBook.bids, grouping, 'bid')
    : orderBook.bids;
  const asks = grouping
    ? aggregateOrderBookLevels(orderBook.asks, grouping, 'ask')
    : orderBook.asks;

  const trimmedBids = bids.slice(0, maxLevels);
  const trimmedAsks = asks.slice(0, maxLevels);

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
  if (!Number.isFinite(total)) {
    return 0;
  }
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
    return ORDER_BOOK_FALLBACK_DISPLAY;
  }
  if (value >= USD_COMPACT_MILLIONS_THRESHOLD) {
    return `$${formatLargeNumber(value, { decimals: 1 })}`;
  }
  if (value >= USD_COMPACT_THOUSANDS_THRESHOLD) {
    return `$${formatLargeNumber(value, { decimals: 0 })}`;
  }
  return formatPerpsFiat(value, { ranges: PRICE_RANGES_UNIVERSAL });
}

/**
 * Format a base-asset amount using the shared perps size formatter (adaptive
 * precision + trailing-zero stripping), optionally honoring the asset's
 * `szDecimals`.
 *
 * @param value - Base-asset amount.
 * @param szDecimals - Optional asset-specific decimal precision.
 * @returns Formatted string.
 */
function formatBase(value: number, szDecimals?: number): string {
  if (!Number.isFinite(value)) {
    return ORDER_BOOK_FALLBACK_DISPLAY;
  }
  return formatPositionSize(value, szDecimals);
}

/**
 * Format the value shown in the metric column based on the selected currency
 * (base/USD) and metric (per-level size or cumulative total).
 *
 * @param level - Order book level.
 * @param currency - Selected currency ('base' | 'usd').
 * @param metric - Selected metric ('size' | 'total').
 * @param szDecimals - Optional asset-specific decimal precision for base amounts.
 * @returns Formatted column value.
 */
export function formatColumnValue(
  level: OrderBookLevel,
  currency: OrderBookListCurrency,
  metric: OrderBookListMetric,
  szDecimals?: number,
): string {
  if (currency === 'usd') {
    const raw = metric === 'total' ? level.totalNotional : level.notional;
    return formatUsd(Number.parseFloat(raw));
  }
  const raw = metric === 'total' ? level.total : level.size;
  return formatBase(Number.parseFloat(raw), szDecimals);
}

/**
 * Format the bid/ask spread as a percentage string (e.g. "0.003%"), matching
 * the compact spread row in the design. Small spreads are kept to a few decimal
 * places with trailing zeros stripped.
 *
 * @param spreadPercentage - Spread as a percentage (e.g. 0.0027 for 0.0027%).
 * @returns Formatted percentage string (with `%`), or the fallback display.
 */
export function formatSpreadPercent(spreadPercentage: number): string {
  if (!Number.isFinite(spreadPercentage)) {
    return ORDER_BOOK_FALLBACK_DISPLAY;
  }
  const rounded = Number(spreadPercentage.toFixed(SPREAD_PERCENT_DECIMALS));
  return `${rounded}%`;
}

/**
 * Compute the buy/sell depth ratio (percentages summing to 100) from the
 * cumulative totals at the deepest displayed level on each side.
 *
 * Uses base-size cumulative totals (`level.total`) rather than notional so the
 * ratio stays consistent with the size-weighted depth bars (`getDepthWidth`),
 * which also key off `level.total`.
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
  const safeBidDepth = Number.isFinite(bidDepth) ? bidDepth : 0;
  const safeAskDepth = Number.isFinite(askDepth) ? askDepth : 0;
  const totalDepth = safeBidDepth + safeAskDepth;
  if (totalDepth <= 0) {
    return null;
  }
  const buyPercent = Math.round((safeBidDepth / totalDepth) * 100);
  return { buyPercent, sellPercent: 100 - buyPercent };
}

/**
 * Clamp an order-book panel width (as a percentage of the body) to the allowed
 * range so neither the form nor the order book collapses.
 *
 * When `containerWidth` is provided, the upper bound is additionally capped so
 * the form keeps at least its pixel floor (`ORDER_BOOK_FORM_MIN_WIDTH_PX`, plus
 * the divider). Without this cap a wide order book on a narrow body pushes the
 * form past its minimum and the panel spills off-screen via the body's
 * horizontal-scroll fallback.
 *
 * @param pct - Requested width percentage.
 * @param containerWidth - Optional body width (px) used to derive a pixel-aware
 * maximum.
 * @returns Clamped width percentage.
 */
export function clampOrderBookWidthPct(
  pct: number,
  containerWidth?: number,
): number {
  if (!Number.isFinite(pct)) {
    return ORDER_BOOK_DEFAULT_WIDTH_PCT;
  }
  let maxPct = ORDER_BOOK_MAX_WIDTH_PCT;
  if (Number.isFinite(containerWidth) && (containerWidth as number) > 0) {
    const width = containerWidth as number;
    const pixelMaxPct =
      ((width - ORDER_BOOK_FORM_MIN_WIDTH_PX - ORDER_BOOK_DIVIDER_WIDTH_PX) /
        width) *
      100;
    // Never let the pixel-derived ceiling drop below the percentage floor; on a
    // very narrow body the pixel floors cannot both fit and the body's
    // overflow-x fallback handles it (documented narrow-popup behavior).
    maxPct = Math.max(ORDER_BOOK_MIN_WIDTH_PCT, Math.min(maxPct, pixelMaxPct));
  }
  return Math.min(maxPct, Math.max(ORDER_BOOK_MIN_WIDTH_PCT, pct));
}

/**
 * Derive the order-book panel width from a pointer position over the body,
 * clamped to the allowed range. The panel is right-aligned, so width grows as
 * the pointer moves left.
 *
 * @param containerRight - Right edge of the body (viewport px).
 * @param containerWidth - Body width (px).
 * @param pointerX - Pointer x-position (viewport px).
 * @returns Clamped width percentage.
 */
export function computeOrderBookWidthPct(
  containerRight: number,
  containerWidth: number,
  pointerX: number,
): number {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    return ORDER_BOOK_DEFAULT_WIDTH_PCT;
  }
  const pct = ((containerRight - pointerX) / containerWidth) * 100;
  return clampOrderBookWidthPct(pct, containerWidth);
}
