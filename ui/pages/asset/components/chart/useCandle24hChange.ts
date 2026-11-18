import { useMemo } from 'react';
import { Hex } from '@metamask/utils';
import { useHistoricalPrices } from '../../hooks/useHistoricalPrices';
import { computePercentChange } from '../../../../components/app/assets/util/percentChange';

/**
 * Time range for the interim 24H-change source. `P1D` is interval-independent,
 * so it yields a true last-24H change regardless of the selected candle
 * interval (candle data is interval-bucketed and would drift).
 */
const TWENTY_FOUR_HOUR_RANGE = 'P1D';

export type UseCandle24hChangeOptions = {
  chainId: Hex;
  address: string;
  /** The user's display currency. */
  currency: string;
  /** Latest/live candle close price, quoted in `candleCurrency`. */
  candlePrice?: number;
  /**
   * The currency the candle price is actually quoted in (the OHLCV resolved
   * currency, which falls back to USD when the API cannot quote `currency`).
   */
  candleCurrency: string;
  /** The wallet's current price, always quoted in the user's `currency`. */
  currentPrice?: number;
  /** Candle mode only. Keeps the underlying source idle in line mode. */
  enabled: boolean;
};

export type Candle24hChange = {
  /** The last-24H percent change (e.g. 5.25 for +5.25%), or undefined. */
  percentChange: number | undefined;
  /** True while the source has not produced a usable value yet. */
  loading: boolean;
};

/**
 * The candlestick header's "last 24H" percent change.
 *
 * This hook is the single seam for *where* the 24H change comes from. The
 * chart component only consumes the returned `percentChange`, so changing the
 * source does not touch any component.
 *
 * Interim source: the interval-independent `P1D` historical-prices series.
 * Candles are interval-bucketed, so a candle-derived 24H baseline drifts with
 * the interval and collapses to 0% on coarse intervals like `1w`.
 *
 * Future source: when the backend ships the `percentChange1D` WebSocket
 * stream, replace the body of this hook with that stream (and delete the
 * historical fetch below). Nothing else needs to change.
 *
 * The percentage must be a ratio of two prices in the *same* currency, so the
 * current value is only taken from the candle price when it resolved in the
 * user's `currency`; otherwise a `currency`-denominated price is used.
 *
 * @param options - See {@link UseCandle24hChangeOptions}.
 * @param options.chainId - The asset's chain ID.
 * @param options.address - The asset's address.
 * @param options.currency - The user's display currency.
 * @param options.candlePrice - Latest/live candle close price, in `candleCurrency`.
 * @param options.candleCurrency - The currency the candle price is quoted in.
 * @param options.currentPrice - The wallet's current price, in `currency`.
 * @param options.enabled - False in line mode, to keep the source idle.
 * @returns The 24H percent change and its loading state.
 */
export function useCandle24hChange({
  chainId,
  address,
  currency,
  candlePrice,
  candleCurrency,
  currentPrice,
  enabled,
}: UseCandle24hChangeOptions): Candle24hChange {
  // ─── Interim source: P1D historical prices ──────────────────────────────
  // Replace this (and the derivation below) with the `percentChange1D` WS
  // stream once it is available.
  const historical = useHistoricalPrices({
    chainId,
    address,
    currency,
    timeRange: TWENTY_FOUR_HOUR_RANGE,
    enabled,
  });

  return useMemo(() => {
    const baseline = historical.isPlaceholderData
      ? undefined
      : historical.data.prices?.[0]?.y;
    const current =
      candleCurrency === currency.toLowerCase()
        ? candlePrice
        : (currentPrice ??
          (historical.isPlaceholderData
            ? undefined
            : historical.data.prices?.at(-1)?.y));

    return {
      percentChange: computePercentChange(current, baseline),
      loading: historical.loading || historical.isPlaceholderData,
    };
  }, [historical, candlePrice, candleCurrency, currency, currentPrice]);
}
