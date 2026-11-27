import { useMemo } from 'react';
import type { OHLCVBar } from './useOHLCVChart';

/**
 * Price display data derived from OHLCV candle data.
 */
export type OHLCVPriceData = {
  /** Current/latest price (close of the most recent bar) */
  price: number | undefined;
};

/**
 * Computes price display data from OHLCV candle data.
 *
 * This hook derives:
 * - `price`: The close price of the most recent candle
 *
 * The 24H percentage change is intentionally NOT derived here. Candles are
 * interval-bucketed, so a candle-based 24H baseline drifts as the interval
 * changes and breaks down on coarse intervals (e.g. 1w). The candle header
 * sources its 24H change from the interval-independent historical-prices (P1D)
 * series instead — see `useCandle24hChange.ts`.
 *
 * @param ohlcvData - Array of OHLCV bars from useOHLCVChart
 * @returns Computed price display data
 *
 * @example
 * ```tsx
 * const { ohlcvData } = useOHLCVChart({ assetId, interval });
 * const { price } = useOHLCVPriceData(ohlcvData);
 * ```
 */
export function useOHLCVPriceData(ohlcvData: OHLCVBar[]): OHLCVPriceData {
  return useMemo(() => ({ price: ohlcvData.at(-1)?.close }), [ohlcvData]);
}
