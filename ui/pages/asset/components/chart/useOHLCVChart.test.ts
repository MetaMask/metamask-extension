import {
  fetchOHLCV,
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

  it('times out after 3 seconds', async () => {
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise(() => {
          // Intentionally never resolves — simulates a hanging fetch
          return undefined;
        }),
    );

    const promise = fetchOHLCV('ethereum', '1h');

    jest.advanceTimersByTime(3_000);

    await expect(promise).rejects.toThrow('OHLCV fetch timeout');
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

  it('passes the AbortSignal to fetch', async () => {
    mockFetchSuccess();
    const controller = new AbortController();

    await fetchOHLCV('ethereum', '1h', 'usd', controller.signal);

    const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(fetchOptions.signal).toBe(controller.signal);
  });
});

describe('useOHLCVChart – INTERVAL_TO_TIME_PERIOD mapping', () => {
  it.each<[string, string]>([
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
