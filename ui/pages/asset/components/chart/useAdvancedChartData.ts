import { useMemo } from 'react';
import { useOHLCVChart, type OHLCVBar } from './useOHLCVChart';
import { useOHLCVRealtime, type OHLCVRealtimeBar } from './useOHLCVRealtime';
import { useOHLCVPriceData } from './useOHLCVPriceData';

export type UseAdvancedChartDataOptions = {
  /** CAIP asset id. Everything stays idle while this is undefined. */
  assetId?: string;
  /** Candle interval, e.g. '15m'. Also keys the realtime channel. */
  interval: string;
  /** The user's display currency. */
  currency: string;
  /**
   * Whether the caller needs the OHLCV candle history. False in line mode,
   * where the legacy chart already has historical prices and only the live
   * bar is missing.
   */
  needsHistory: boolean;
};

export type UseAdvancedChartDataResult = {
  /** Candle history as fetched. Empty unless `needsHistory`. */
  ohlcvData: OHLCVBar[];
  /** The live bar itself, forwarded to the chart engine. */
  realtimeBar?: OHLCVRealtimeBar;
  /** Latest traded price, available in both modes. */
  realtimePrice?: number;
  realtimeTimestamp?: number;
  /** Header figures derived from the candle history. Candle mode only. */
  price?: number;
  percentChange?: number;
  timestamp?: number;
  isLoading: boolean;
  error: string | null;
  /** The currency the candle history is actually priced in. */
  resolvedCurrency: string;
};

/**
 * Owns the OHLCV data path behind the advanced chart.
 *
 * Realtime runs in both chart modes — the line chart shows a live price too —
 * but the candle history is fetched only when something will plot it. The
 * realtime subscription has its own REST staleness fallback, so it does not
 * depend on the history being loaded.
 */
export function useAdvancedChartData({
  assetId,
  interval,
  currency,
  needsHistory,
}: UseAdvancedChartDataOptions): UseAdvancedChartDataResult {
  const { ohlcvData, isLoading, error, resolvedCurrency } = useOHLCVChart({
    assetId,
    interval,
    currency,
    enabled: needsHistory,
  });

  const { latestBar } = useOHLCVRealtime({
    assetId,
    interval,
    currency: currency.toLowerCase(),
    enabled: Boolean(assetId),
  });

  // The chart engine applies the live bar itself, but the header figures are
  // computed here, so splice it in before deriving them. Otherwise the header
  // would lag the chart by a candle.
  const mergedOhlcvData = useMemo(() => {
    if (!latestBar || ohlcvData.length === 0) {
      return ohlcvData;
    }
    const lastBar = ohlcvData.at(-1);
    return lastBar && latestBar.time >= lastBar.time
      ? [...ohlcvData.slice(0, -1), latestBar]
      : ohlcvData;
  }, [ohlcvData, latestBar]);

  const { price, percentChange, timestamp } =
    useOHLCVPriceData(mergedOhlcvData);

  return {
    ohlcvData,
    realtimeBar: latestBar ?? undefined,
    realtimePrice: latestBar?.close,
    realtimeTimestamp: latestBar?.time,
    price,
    percentChange,
    timestamp,
    isLoading,
    error,
    resolvedCurrency,
  };
}
