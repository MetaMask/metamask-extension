import React from 'react';
import { it } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { priceApiBaseUrl } from '../../../../../shared/constants/price-api';
import {
  fetchOHLCVPage,
  useOHLCVChart,
  FETCH_TIMEOUT_MS,
  OHLCV_BASE_URL,
  type FetchOlderBarsResult,
} from './useOHLCVChart';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Creates a fresh QueryClient + Provider wrapper for each test. */
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function wrapperElement({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
};

const MOCK_API_CANDLES = [
  {
    timestamp: 1700000000,
    open: 1,
    high: 2,
    low: 0.5,
    close: 1.5,
    volume: 100,
  },
  {
    timestamp: 1700003600,
    open: 1.5,
    high: 3,
    low: 1,
    close: 2.5,
    volume: 200,
  },
];

const mockFetchSuccess = (data = MOCK_API_CANDLES, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue({ data }),
  } as unknown as Response);
};

const mockFetchFailure = (status: number) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: jest.fn(),
  } as unknown as Response);
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('useOHLCVChart – fetchOHLCVPage (first page)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns mapped OHLCVBar array on success', async () => {
    mockFetchSuccess();

    const { bars } = await fetchOHLCVPage('ethereum', '1h');

    expect(bars).toHaveLength(2);
    expect(bars[0]).toEqual({
      time: 1700000000,
      open: 1,
      high: 2,
      low: 0.5,
      close: 1.5,
      volume: 100,
    });
    expect(bars[1]).toEqual({
      time: 1700003600,
      open: 1.5,
      high: 3,
      low: 1,
      close: 2.5,
      volume: 200,
    });
  });

  it('returns empty array when API data is null', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ data: null }),
    } as unknown as Response);

    const { bars } = await fetchOHLCVPage('ethereum', '1h');
    expect(bars).toEqual([]);
  });

  it('throws on non-200 response', async () => {
    mockFetchFailure(500);

    await expect(fetchOHLCVPage('ethereum', '1h')).rejects.toThrow(
      'OHLCV API error: 500',
    );
  });

  it('throws on 404 response', async () => {
    mockFetchFailure(404);

    await expect(fetchOHLCVPage('ethereum', '1h')).rejects.toThrow(
      'OHLCV API error: 404',
    );
  });

  it('times out, and aborts the request rather than leaving it running', async () => {
    let abortedSignal: AbortSignal | undefined;
    // Mirrors real fetch: hangs until its signal aborts, then rejects.
    global.fetch = jest.fn().mockImplementation(
      (_url: string, { signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            abortedSignal = signal;
            reject(new Error('The operation was aborted'));
          });
        }),
    );

    const promise = fetchOHLCVPage('ethereum', '1h');

    jest.advanceTimersByTime(FETCH_TIMEOUT_MS);

    await expect(promise).rejects.toThrow('OHLCV fetch timeout');
    expect(abortedSignal?.aborted).toBe(true);
  });

  it('does not leave the timeout timer pending after a successful fetch', async () => {
    mockFetchSuccess();

    await fetchOHLCVPage('ethereum', '1h');

    expect(jest.getTimerCount()).toBe(0);
  });

  it('derives the base URL from the shared prices-API base (honours MM_BACKEND_PRICES_API_URL)', () => {
    // Guards against regressing to a hardcoded production URL that would ignore
    // a staging/local prices backend.
    expect(OHLCV_BASE_URL).toBe(`${priceApiBaseUrl}/v3/ohlcv-chart`);
  });

  it('constructs URL correctly with all params', async () => {
    mockFetchSuccess();

    await fetchOHLCVPage('ethereum', '4h', 'eur');

    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    const url = new URL(calledUrl);

    expect(url.origin + url.pathname).toBe(`${OHLCV_BASE_URL}/ethereum`);
    expect(url.searchParams.get('timePeriod')).toBe('1m');
    expect(url.searchParams.get('interval')).toBe('4h');
    expect(url.searchParams.get('vsCurrency')).toBe('eur');
  });

  it('defaults vsCurrency to "usd"', async () => {
    mockFetchSuccess();

    await fetchOHLCVPage('bitcoin', '1d');

    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    const url = new URL(calledUrl);

    expect(url.searchParams.get('vsCurrency')).toBe('usd');
  });

  it('falls back to "1d" timePeriod for unknown interval', async () => {
    mockFetchSuccess();

    await fetchOHLCVPage('ethereum', 'unknown_interval');

    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    const url = new URL(calledUrl);

    expect(url.searchParams.get('timePeriod')).toBe('1d');
  });

  it('propagates the caller aborting to the request', async () => {
    let seen: AbortSignal | undefined;
    global.fetch = jest
      .fn()
      .mockImplementation(
        (_url: string, { signal }: { signal: AbortSignal }) => {
          seen = signal;
          return new Promise(() => undefined);
        },
      );
    const controller = new AbortController();

    // eslint-disable-next-line no-void -- asserting on the signal, not the result
    void fetchOHLCVPage('ethereum', '1h', 'usd', {
      signal: controller.signal,
    });
    expect(seen?.aborted).toBe(false);

    controller.abort();

    expect(seen?.aborted).toBe(true);
  });
});

describe('useOHLCVChart', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests the display currency rather than always USD', async () => {
    mockFetchSuccess();

    renderHook(
      () =>
        useOHLCVChart({
          assetId: 'ethereum',
          interval: '1h',
          currency: 'EUR',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const url = new URL((global.fetch as jest.Mock).mock.calls[0][0] as string);
    expect(url.searchParams.get('vsCurrency')).toBe('eur');
  });

  it('retries in USD and reports it when the API rejects the currency', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 400, json: jest.fn() })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: MOCK_API_CANDLES }),
      });

    const { result } = renderHook(
      () =>
        useOHLCVChart({
          assetId: 'ethereum',
          interval: '1h',
          currency: 'sek',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.ohlcvData).toHaveLength(2));
    expect(result.current.error).toBeNull();
    expect(result.current.resolvedCurrency).toBe('usd');

    const retryUrl = new URL(
      (global.fetch as jest.Mock).mock.calls[1][0] as string,
    );
    expect(retryUrl.searchParams.get('vsCurrency')).toBe('usd');
  });

  it('surfaces the error instead of retrying when USD itself fails', async () => {
    mockFetchFailure(500);

    const { result } = renderHook(
      () =>
        useOHLCVChart({
          assetId: 'ethereum',
          interval: '1h',
          currency: 'usd',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(result.current.error).toBe('OHLCV API error: 500'),
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('makes no request when the asset id is undefined', () => {
    mockFetchSuccess();

    const { result } = renderHook(
      () =>
        useOHLCVChart({
          assetId: undefined,
          interval: '1h',
          currency: 'usd',
        }),
      { wrapper: createWrapper() },
    );

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('makes no request while disabled, as in line chart mode', () => {
    mockFetchSuccess();

    renderHook(
      () =>
        useOHLCVChart({
          assetId: 'ethereum',
          interval: '1h',
          currency: 'usd',
          enabled: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('clears the previous series and shows loading the instant the inputs change, so stale bars never linger', async () => {
    // First series resolves; the second request hangs so the state right after
    // the switch is observable before the new data lands.
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: MOCK_API_CANDLES }),
      } as unknown as Response)
      .mockReturnValueOnce(new Promise(() => undefined));

    const wrapper = createWrapper();
    const { result, rerender } = renderHook(
      ({ assetId }) =>
        useOHLCVChart({ assetId, interval: '1h', currency: 'usd' }),
      { initialProps: { assetId: 'ethereum' }, wrapper },
    );

    await waitFor(() => expect(result.current.ohlcvData).toHaveLength(2));

    // Switching the asset triggers a new queryKey with no cached data.
    // React Query sets `isLoading` and returns no data for the uncached key.
    rerender({ assetId: 'bitcoin' });

    expect(result.current.ohlcvData).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('keeps the loaded candles when toggling to line mode and back, so the iframe does not blank', async () => {
    mockFetchSuccess();

    const wrapper = createWrapper();
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useOHLCVChart({
          assetId: 'ethereum',
          interval: '1h',
          currency: 'usd',
          enabled,
        }),
      { initialProps: { enabled: true }, wrapper },
    );

    await waitFor(() => expect(result.current.ohlcvData).toHaveLength(2));

    // Line mode disables the hook; React Query keeps the cached data so bars
    // survive even though the query is no longer active.
    rerender({ enabled: false });
    expect(result.current.ohlcvData).toHaveLength(2);

    // Back to candle mode: still the same bars from cache, never cleared.
    rerender({ enabled: true });
    expect(result.current.ohlcvData).toHaveLength(2);
  });

  it('shows loading without wiping data on a cold line→candle toggle', async () => {
    // Fetch hangs so the state right after enabling is observable.
    global.fetch = jest.fn().mockReturnValue(new Promise(() => undefined));

    const wrapper = createWrapper();
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useOHLCVChart({
          assetId: 'ethereum',
          interval: '1h',
          currency: 'usd',
          enabled,
        }),
      { initialProps: { enabled: false }, wrapper },
    );

    // Starts idle in line mode: no request, no bars, not loading.
    expect(result.current.isLoading).toBe(false);
    expect(result.current.ohlcvData).toEqual([]);

    // Entering candle mode with no cached data shows loading immediately.
    rerender({ enabled: true });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.ohlcvData).toEqual([]);
  });
});

describe('useOHLCVChart – fetchOHLCVPage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockPage = (
    data: typeof MOCK_API_CANDLES,
    nextCursor: string | null,
    hasNext: boolean,
  ) =>
    ({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ data, nextCursor, hasNext }),
    }) as unknown as Response;

  it('parses the cursor fields from the response', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(mockPage(MOCK_API_CANDLES, 'c1', true));

    const page = await fetchOHLCVPage('ethereum', '1h');

    expect(page.bars).toHaveLength(2);
    expect(page.nextCursor).toBe('c1');
    expect(page.hasMore).toBe(true);
  });

  it('defaults the cursor fields when the API omits them', async () => {
    mockFetchSuccess();

    const page = await fetchOHLCVPage('ethereum', '1h');

    expect(page.nextCursor).toBeNull();
    expect(page.hasMore).toBe(false);
  });

  it('addresses an older page by cursor alone, dropping timePeriod/interval', async () => {
    const fetchMock = jest.fn().mockResolvedValue(mockPage([], null, false));
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchOHLCVPage('ethereum', '1h', 'eur', { nextCursor: 'cursor-xyz' });

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.searchParams.get('nextCursor')).toBe('cursor-xyz');
    expect(url.searchParams.get('vsCurrency')).toBe('eur');
    expect(url.searchParams.has('timePeriod')).toBe(false);
    expect(url.searchParams.has('interval')).toBe(false);
  });
});

describe('useOHLCVChart – fetchOlderBars', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockPage = (
    data: typeof MOCK_API_CANDLES,
    nextCursor: string | null,
    hasNext: boolean,
  ) =>
    ({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ data, nextCursor, hasNext }),
    }) as unknown as Response;

  it('pages older bars by cursor and advances it each call', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'cursor-1', true))
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'cursor-2', true))
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, null, false));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(
      () =>
        useOHLCVChart({
          assetId: 'ethereum',
          interval: '1h',
          currency: 'usd',
        }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.ohlcvData).toHaveLength(2));
    // The iframe anchors the cursor when it posts the full SET_OHLCV_DATA.
    act(() => result.current.resetPagination());

    let older;
    await act(async () => {
      older = await result.current.fetchOlderBars();
    });
    expect(older).toEqual({ bars: expect.any(Array), noData: false });
    const firstPageUrl = new URL(fetchMock.mock.calls[1][0] as string);
    expect(firstPageUrl.searchParams.get('nextCursor')).toBe('cursor-1');

    await act(async () => {
      await result.current.fetchOlderBars();
    });
    const secondPageUrl = new URL(fetchMock.mock.calls[2][0] as string);
    expect(secondPageUrl.searchParams.get('nextCursor')).toBe('cursor-2');
  });

  it('returns noData without fetching once the cursor is exhausted', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(mockPage(MOCK_API_CANDLES, null, false));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(
      () =>
        useOHLCVChart({
          assetId: 'ethereum',
          interval: '1h',
          currency: 'usd',
        }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.ohlcvData).toHaveLength(2));
    // The iframe anchors the cursor when it posts the full SET_OHLCV_DATA.
    act(() => result.current.resetPagination());

    let older;
    await act(async () => {
      older = await result.current.fetchOlderBars();
    });
    expect(older).toEqual({ bars: [], noData: true });
    // Only the initial load fetched; the exhausted cursor short-circuits.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('accumulates successive pages in one call until countBack is met', async () => {
    // Initial load + three older pages, two bars each. countBack 5 should pull
    // pages until >= 5 bars are gathered (3 pages = 6 bars) and return them as
    // a single batch, advancing the cursor through each page.
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'cursor-1', true))
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'cursor-2', true))
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'cursor-3', true))
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'cursor-4', true));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(
      () =>
        useOHLCVChart({
          assetId: 'ethereum',
          interval: '1h',
          currency: 'usd',
        }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.ohlcvData).toHaveLength(2));
    // The iframe anchors the cursor when it posts the full SET_OHLCV_DATA.
    act(() => result.current.resetPagination());

    let older;
    await act(async () => {
      older = await result.current.fetchOlderBars(5);
    });

    // One initial load + three older-page fetches, all in the single call.
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(older).toEqual({ bars: expect.any(Array), noData: false });
    expect((older as unknown as FetchOlderBarsResult).bars).toHaveLength(6);
    // The cursor walked page by page: last older fetch used cursor-3.
    const lastUrl = new URL(fetchMock.mock.calls[3][0] as string);
    expect(lastUrl.searchParams.get('nextCursor')).toBe('cursor-3');
  });

  it('stops accumulating when history runs out before countBack is met', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'cursor-1', true))
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, null, false));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(
      () =>
        useOHLCVChart({
          assetId: 'ethereum',
          interval: '1h',
          currency: 'usd',
        }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.ohlcvData).toHaveLength(2));
    // The iframe anchors the cursor when it posts the full SET_OHLCV_DATA.
    act(() => result.current.resetPagination());

    let older;
    await act(async () => {
      older = await result.current.fetchOlderBars(100);
    });

    // Asked for 100 but history ends after the first older page; returns what
    // exists rather than looping forever.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((older as unknown as FetchOlderBarsResult).bars).toHaveLength(2);
    expect((older as unknown as FetchOlderBarsResult).noData).toBe(false);
  });

  it('keeps the advanced cursor when a refetch delivers new data (no rewind)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'page-2', true))
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'page-3', true))
      // background refetch of page 1
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'page-2-fresh', true))
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'page-4', true));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(
      () =>
        useOHLCVChart({ assetId: 'ethereum', interval: '1h', currency: 'usd' }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.ohlcvData).toHaveLength(2));
    act(() => result.current.resetPagination());

    await act(async () => {
      await result.current.fetchOlderBars();
    });

    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ['ohlcv'] });
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    await act(async () => {
      await result.current.fetchOlderBars();
    });
    const url = new URL(fetchMock.mock.calls[3][0] as string);
    expect(url.searchParams.get('nextCursor')).toBe('page-3');
  });

  it('re-anchors to the cached page cursor on resetPagination', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'page-2', true))
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'page-3', true))
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'page-3', true));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(
      () =>
        useOHLCVChart({ assetId: 'ethereum', interval: '1h', currency: 'usd' }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.ohlcvData).toHaveLength(2));
    act(() => result.current.resetPagination());
    await act(async () => {
      await result.current.fetchOlderBars();
    });

    act(() => result.current.resetPagination());
    await act(async () => {
      await result.current.fetchOlderBars();
    });
    const url = new URL(fetchMock.mock.calls[2][0] as string);
    expect(url.searchParams.get('nextCursor')).toBe('page-2');
  });

  it('drops an in-flight page and keeps the new cursor when a reset lands mid-flight', async () => {
    let resolveOlder: (r: Response) => void = () => undefined;
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'page-2', true))
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveOlder = resolve;
          }),
      )
      .mockResolvedValueOnce(mockPage(MOCK_API_CANDLES, 'page-3', true));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(
      () =>
        useOHLCVChart({ assetId: 'ethereum', interval: '1h', currency: 'usd' }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.ohlcvData).toHaveLength(2));
    act(() => result.current.resetPagination());

    let pending: Promise<FetchOlderBarsResult> | undefined;
    act(() => {
      pending = result.current.fetchOlderBars();
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    act(() => result.current.resetPagination());
    let stale: FetchOlderBarsResult | undefined;
    await act(async () => {
      resolveOlder(mockPage(MOCK_API_CANDLES, 'stale-cursor', true));
      stale = await pending;
    });
    expect(stale).toEqual({ bars: [], noData: true });

    // The stale call neither advanced the cursor nor kept the lock.
    await act(async () => {
      await result.current.fetchOlderBars();
    });
    const url = new URL(fetchMock.mock.calls[2][0] as string);
    expect(url.searchParams.get('nextCursor')).toBe('page-2');
  });
});

describe('useOHLCVChart – timePeriod query param', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each<[string, string]>([
    ['1m', '1d'],
    ['5m', '1d'],
    ['15m', '1d'],
    ['1h', '1w'],
    ['4h', '1m'],
    ['1d', '1m'],
    ['1w', '1y'],
  ])(
    'requests interval "%s" with timePeriod "%s"',
    async (interval, expected) => {
      mockFetchSuccess();

      await fetchOHLCVPage('ethereum', interval);

      const url = new URL(
        (global.fetch as jest.Mock).mock.calls[0][0] as string,
      );
      expect(url.searchParams.get('timePeriod')).toBe(expected);
    },
  );
});
