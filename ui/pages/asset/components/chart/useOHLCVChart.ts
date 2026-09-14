import { useEffect, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type OHLCVBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type UseOHLCVChartOptions = {
  assetId: string;
  interval: string;
  vsCurrency?: string;
};

export type UseOHLCVChartResult = {
  ohlcvData: OHLCVBar[];
  isLoading: boolean;
  error: string | null;
};

// ─── Constants ──────────────────────────────────────────────────────────────

export const OHLCV_BASE_URL = 'https://price.api.cx.metamask.io/v3/ohlcv-chart';

/** Maps a candle interval to the timePeriod query param the OHLCV API expects. */
export const INTERVAL_TO_TIME_PERIOD: Record<string, string> = {
  '1m': '1d',
  '5m': '1d',
  '15m': '1d',
  '1h': '1w',
  '4h': '1m',
  '1d': '1m',
  '1w': '1y',
};

const FETCH_TIMEOUT_MS = 3_000;

// ─── Pure fetch function (exported for testing & direct use) ────────────────

type OHLCVApiCandle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/**
 * Fetches OHLCV candle data from the MetaMask Price API.
 *
 * @param assetId    - CAIP or CoinGecko asset identifier
 * @param interval   - Candle interval (e.g. '1h', '1d')
 * @param vsCurrency - Fiat quote currency (default 'usd')
 * @param signal     - Optional AbortSignal for cancellation
 * @returns Mapped array of OHLCVBar objects
 */
export async function fetchOHLCV(
  assetId: string,
  interval: string,
  vsCurrency = 'usd',
  signal?: AbortSignal,
): Promise<OHLCVBar[]> {
  const timePeriod = INTERVAL_TO_TIME_PERIOD[interval] ?? '1d';
  const url = new URL(`${OHLCV_BASE_URL}/${assetId}`);
  url.searchParams.set('timePeriod', timePeriod);
  url.searchParams.set('interval', interval);
  url.searchParams.set('vsCurrency', vsCurrency);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error('OHLCV fetch timeout')),
      FETCH_TIMEOUT_MS,
    );
  });

  const response = await Promise.race([
    fetch(url.toString(), { signal }),
    timeoutPromise,
  ]);

  if (!response.ok) {
    throw new Error(`OHLCV API error: ${response.status}`);
  }

  const json = await response.json();
  return (json.data ?? []).map((c: OHLCVApiCandle) => ({
    time: c.timestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
}

// ─── React hook ─────────────────────────────────────────────────────────────

/**
 * Fetches OHLCV chart data reactively.
 * Re-fetches whenever assetId, interval, or vsCurrency changes.
 * Aborts in-flight requests on unmount or when inputs change.
 *
 * @param options - Hook options
 * @param options.assetId - CAIP or CoinGecko asset identifier
 * @param options.interval - Candle interval (e.g. '1h', '1d')
 * @param options.vsCurrency - Optional fiat quote currency
 */
export const useOHLCVChart = ({
  assetId,
  interval,
  vsCurrency,
}: UseOHLCVChartOptions): UseOHLCVChartResult => {
  const [ohlcvData, setOhlcvData] = useState<OHLCVBar[]>([]);
  const [isLoading, setIsLoading] = useState(assetId !== '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assetId === '') {
      return undefined;
    }

    const controller = new AbortController();

    // eslint-disable-next-line no-void -- fire-and-forget async data fetch inside effect
    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchOHLCV(
          assetId,
          interval,
          vsCurrency,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setOhlcvData(data);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setOhlcvData([]);
          setError(e instanceof Error ? e.message : 'Unknown error');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [assetId, interval, vsCurrency]);

  return { ohlcvData, isLoading, error };
};
