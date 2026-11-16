import { useMemo } from 'react';
import type { OHLCVBar } from './useOHLCVChart';

/** 24 hours in milliseconds. OHLCV bar `time` values are in ms. */
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Price display data derived from OHLCV candle data.
 */
export type OHLCVPriceData = {
  /** Current/latest price (close of the most recent bar) */
  price: number | undefined;
  /** Percentage change over the last 24 hours (latest close vs the close ~24h ago) */
  percentChange: number | undefined;
  /** Timestamp of the latest bar */
  timestamp: number | undefined;
};

/**
 * Computes price display data from OHLCV candle data.
 *
 * This hook derives:
 * - `price`: The close price of the most recent candle
 * - `percentChange`: The last-24H change (latest close vs the close ~24h ago),
 *   matching mobile so the figure is independent of the candle interval
 * - `timestamp`: The timestamp of the most recent candle
 *
 * This allows the TokenPriceHeader to display OHLCV-based prices without
 * needing to know the underlying data format.
 *
 * @param ohlcvData - Array of OHLCV bars from useOHLCVChart
 * @returns Computed price display data
 *
 * @example
 * ```tsx
 * const { ohlcvData } = useOHLCVChart({ assetId, interval });
 * const { price, percentChange, timestamp } = useOHLCVPriceData(ohlcvData);
 *
 * return (
 *   <TokenPriceHeader
 *     price={price}
 *     percentChange={percentChange}
 *     timestamp={timestamp}
 *     currency={currency}
 *   />
 * );
 * ```
 */
export function useOHLCVPriceData(ohlcvData: OHLCVBar[]): OHLCVPriceData {
  return useMemo(() => {
    if (!ohlcvData || ohlcvData.length === 0) {
      return {
        price: undefined,
        percentChange: undefined,
        timestamp: undefined,
      };
    }

    const latestBar = ohlcvData.at(-1);
    if (!latestBar) {
      return {
        price: undefined,
        percentChange: undefined,
        timestamp: undefined,
      };
    }

    const price = latestBar.close;
    const timestamp = latestBar.time;

    // Baseline is the close of the bar closest to 24h before the latest bar, so
    // the percentage is always a 24H change regardless of the selected candle
    // interval (matching mobile). Falls back to the first bar's close when the
    // loaded history is shorter than 24h.
    const target24h = latestBar.time - TWENTY_FOUR_HOURS_MS;
    const comparePrice = (
      ohlcvData.find((c) => c.time >= target24h) ?? ohlcvData[0]
    ).close;

    // Calculate percentage change: ((current - compare) / compare) * 100
    // Guard against division by zero
    const percentChange =
      comparePrice === 0
        ? undefined
        : ((price - comparePrice) / comparePrice) * 100;

    return {
      price,
      percentChange,
      timestamp,
    };
  }, [ohlcvData]);
}
