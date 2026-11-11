import { act, renderHook, waitFor } from '@testing-library/react';
import {
  fetchOHLCV,
  fetchOHLCVPage,
  useOHLCVChart,
  FETCH_TIMEOUT_MS,
  INTERVAL_TO_TIME_PERIOD,
  OHLCV_BASE_URL,
} from './useOHLCVChart';

// ─── Helpers ────────────────────────────────────────────────────────────────

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

describe('useOHLCVChart – fetchOHLCV', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns mapped OHLCVBar array on success', async () => {
    mockFetchSuccess();

    const bars = await fetchOHLCV('ethereum', '1h');

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

    const bars = await fetchOHLCV('ethereum', '1h');
    expect(bars).toEqual([]);
  });

  it('throws on non-200 response', async () => {
    mockFetchFailure(500);

    await expect(fetchOHLCV('ethereum', '1h')).rejects.toThrow(
      'OHLCV API error: 500',
    );
  });

  it('throws on 404 response', async () => {
    mockFetchFailure(404);

    await expect(fetchOHLCV('ethereum', '1h')).rejects.toThrow(
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

    const promise = fetchOHLCV('ethereum', '1h');

    jest.advanceTimersByTime(FETCH_TIMEOUT_MS);

    await expect(promise).rejects.toThrow('OHLCV fetch timeout');
    expect(abortedSignal?.aborted).toBe(true);
  });

  it('does not leave the timeout timer pending after a successful fetch', async () => {
    mockFetchSuccess();

    await fetchOHLCV('ethereum', '1h');

    expect(jest.getTimerCount()).toBe(0);
  });

  it('constructs URL correctly with all params', async () => {
    mockFetchSuccess();

    await fetchOHLCV('ethereum', '4h', 'eur');

    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    const url = new URL(calledUrl);

    expect(url.origin + url.pathname).toBe(`${OHLCV_BASE_URL}/ethereum`);
    expect(url.searchParams.get('timePeriod')).toBe('1m');
    expect(url.searchParams.get('interval')).toBe('4h');
    expect(url.searchParams.get('vsCurrency')).toBe('eur');
  });

  it('defaults vsCurrency to "usd"', async () => {
    mockFetchSuccess();

    await fetchOHLCV('bitcoin', '1d');

    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    const url = new URL(calledUrl);

    expect(url.searchParams.get('vsCurrency')).toBe('usd');
  });

  it('falls back to "1d" timePeriod for unknown interval', async () => {
    mockFetchSuccess();

    await fetchOHLCV('ethereum', 'unknown_interval');

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
    void fetchOHLCV('ethereum', '1h', 'usd', controller.signal);
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

    renderHook(() =>
      useOHLCVChart({ assetId: 'ethereum', interval: '1h', currency: 'EUR' }),
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

    const { result } = renderHook(() =>
      useOHLCVChart({ assetId: 'ethereum', interval: '1h', currency: 'sek' }),
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

    const { result } = renderHook(() =>
      useOHLCVChart({ assetId: 'ethereum', interval: '1h', currency: 'usd' }),
    );

    await waitFor(() =>
      expect(result.current.error).toBe('OHLCV API error: 500'),
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('makes no request when the asset id is undefined', () => {
    mockFetchSuccess();

    const { result } = renderHook(() =>
      useOHLCVChart({ assetId: undefined, interval: '1h', currency: 'usd' }),
    );

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('makes no request while disabled, as in line chart mode', () => {
    mockFetchSuccess();

    renderHook(() =>
      useOHLCVChart({
        assetId: 'ethereum',
        interval: '1h',
        currency: 'usd',
        enabled: false,
      }),
    );

    expect(global.fetch).not.toHaveBeenCalled();
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

    const { result } = renderHook(() =>
      useOHLCVChart({ assetId: 'ethereum', interval: '1h', currency: 'usd' }),
    );
    await waitFor(() => expect(result.current.ohlcvData).toHaveLength(2));

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

    const { result } = renderHook(() =>
      useOHLCVChart({ assetId: 'ethereum', interval: '1h', currency: 'usd' }),
    );
    await waitFor(() => expect(result.current.ohlcvData).toHaveLength(2));

    let older;
    await act(async () => {
      older = await result.current.fetchOlderBars();
    });
    expect(older).toEqual({ bars: [], noData: true });
    // Only the initial load fetched; the exhausted cursor short-circuits.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('useOHLCVChart – INTERVAL_TO_TIME_PERIOD mapping', () => {
  // @ts-expect-error This is missing from the Mocha type definitions
  test.each<[string, string]>([
    ['1m', '1d'],
    ['5m', '1d'],
    ['15m', '1d'],
    ['1h', '1w'],
    ['4h', '1m'],
    ['1d', '1m'],
    ['1w', '1y'],
  ])(
    'maps interval "%s" → timePeriod "%s"',
    (interval: string, expected: string) => {
      expect(INTERVAL_TO_TIME_PERIOD[interval]).toBe(expected);
    },
  );

  it('has exactly 7 entries', () => {
    expect(Object.keys(INTERVAL_TO_TIME_PERIOD)).toHaveLength(7);
  });
});
