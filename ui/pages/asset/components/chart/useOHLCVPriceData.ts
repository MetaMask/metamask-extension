import { useMemo } from 'react';
import type { OHLCVBar } from './useOHLCVChart';

/**
 * Price display data derived from OHLCV candle data.
 */
export type OHLCVPriceData = {
  /** Current/latest price (close of the most recent bar) */
  price: number | undefined;
  /** Percentage change from first bar's open to latest bar's close */
  percentChange: number | undefined;
  /** Timestamp of the latest bar */
  timestamp: number | undefined;
};

/**
 * Computes price display data from OHLCV candle data.
 *
 * This hook derives:
 * - `price`: The close price of the most recent candle
 * - `percentChange`: The percentage change from the first candle's open to the latest close
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

    const firstBar = ohlcvData[0];
    const latestBar = ohlcvData.at(-1);
    if (!latestBar) {
      return {
        price: undefined,
        percentChange: undefined,
        timestamp: undefined,
      };
    }

    const price = latestBar.close;
    const comparePrice = firstBar.open;
    const timestamp = latestBar.time;

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
