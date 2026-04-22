import { renderHook, act } from '@testing-library/react-hooks';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { usePerpsLiveMarketData } from './usePerpsLiveMarketData';
import { usePerpsStreamManager } from './usePerpsStreamManager';

jest.mock('./usePerpsStreamManager');

const usePerpsStreamManagerMock = usePerpsStreamManager as jest.MockedFunction<
  typeof usePerpsStreamManager
>;

const createMockMarket = (
  overrides: Partial<PerpsMarketData> = {},
): PerpsMarketData => ({
  symbol: overrides.symbol ?? 'BTC',
  name: overrides.name ?? 'Bitcoin',
  maxLeverage: overrides.maxLeverage ?? '20x',
  price: overrides.price ?? '$50,000',
  change24h: overrides.change24h ?? '+$1,250.00',
  change24hPercent: overrides.change24hPercent ?? '+2.5%',
  volume: overrides.volume ?? '$1.2B',
  openInterest: overrides.openInterest,
  nextFundingTime: overrides.nextFundingTime,
  fundingIntervalHours: overrides.fundingIntervalHours,
  fundingRate: overrides.fundingRate,
  marketSource: overrides.marketSource,
  marketType: overrides.marketType,
});

type SubscribeCallback = (data: PerpsMarketData[]) => void;

function createMockStreamManager(cachedMarkets?: PerpsMarketData[]) {
  let subscriber: SubscribeCallback | null = null;
  const unsubscribe = jest.fn(() => {
    subscriber = null;
  });

  const markets = {
    getCachedData: jest.fn(() => cachedMarkets ?? []),
    hasCachedData: jest.fn(() => Boolean(cachedMarkets?.length)),
    clearCache: jest.fn(),
    refresh: jest.fn(),
    subscribe: jest.fn((cb: SubscribeCallback) => {
      subscriber = cb;
      if (cachedMarkets?.length) {
        cb(cachedMarkets);
      }
      return unsubscribe;
    }),
  };

  return {
    streamManager: { markets } as never,
    pushMarkets: (data: PerpsMarketData[]) => subscriber?.(data),
    unsubscribe,
  };
}

describe('usePerpsLiveMarketData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty markets and loading state when stream manager is initializing', () => {
    usePerpsStreamManagerMock.mockReturnValue({
      streamManager: null,
      isInitializing: true,
      error: null,
      selectedAddress: '0x123',
    });

    const { result } = renderHook(() => usePerpsLiveMarketData());

    expect(result.current.markets).toEqual([]);
    expect(result.current.cryptoMarkets).toEqual([]);
    expect(result.current.hip3Markets).toEqual([]);
    expect(result.current.isInitialLoading).toBe(true);
  });

  it('filters out zero-volume markets from the returned markets', () => {
    const allMarkets = [
      createMockMarket({ symbol: 'BTC', volume: '$1.2B' }),
      createMockMarket({ symbol: 'MATIC', volume: '$0' }),
      createMockMarket({ symbol: 'ETH', volume: '$850M' }),
      createMockMarket({ symbol: 'DOGE', volume: '' }),
    ];

    const { streamManager } = createMockStreamManager(allMarkets);

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    const { result } = renderHook(() => usePerpsLiveMarketData());

    expect(result.current.markets).toHaveLength(2);
    expect(result.current.markets.map((m) => m.symbol)).toEqual(['BTC', 'ETH']);
  });

  it('filters zero-volume markets from live subscription updates', () => {
    const initialMarkets = [
      createMockMarket({ symbol: 'BTC', volume: '$1.2B' }),
    ];

    const { streamManager, pushMarkets } =
      createMockStreamManager(initialMarkets);

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    const { result } = renderHook(() => usePerpsLiveMarketData());

    expect(result.current.markets).toHaveLength(1);

    act(() => {
      pushMarkets([
        createMockMarket({ symbol: 'BTC', volume: '$1.2B' }),
        createMockMarket({ symbol: 'MATIC', volume: '$0' }),
        createMockMarket({ symbol: 'SOL', volume: '$500M' }),
      ]);
    });

    expect(result.current.markets).toHaveLength(2);
    expect(result.current.markets.map((m) => m.symbol)).toEqual(['BTC', 'SOL']);
  });

  it('splits active markets into crypto and HIP-3 categories', () => {
    const allMarkets = [
      createMockMarket({ symbol: 'BTC', volume: '$1.2B' }),
      createMockMarket({
        symbol: 'xyz:TSLA',
        volume: '$50M',
        marketSource: 'xyz',
      }),
      createMockMarket({ symbol: 'ETH', volume: '$850M' }),
      createMockMarket({
        symbol: 'abc:AAPL',
        volume: '$0',
        marketSource: 'abc',
      }),
      createMockMarket({
        symbol: 'xyz:GOOG',
        volume: '$30M',
        marketSource: 'xyz',
      }),
    ];

    const { streamManager } = createMockStreamManager(allMarkets);

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    const { result } = renderHook(() => usePerpsLiveMarketData());

    expect(result.current.cryptoMarkets.map((m) => m.symbol)).toEqual([
      'BTC',
      'ETH',
    ]);
    expect(result.current.hip3Markets.map((m) => m.symbol)).toEqual([
      'xyz:TSLA',
      'xyz:GOOG',
    ]);
  });

  it('sets isInitialLoading to false when autoSubscribe is false', () => {
    const { streamManager } = createMockStreamManager([]);

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    const { result } = renderHook(() =>
      usePerpsLiveMarketData({ autoSubscribe: false }),
    );

    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.markets).toEqual([]);
  });

  it('refresh triggers a market refresh without resetting loading state', () => {
    const allMarkets = [createMockMarket({ symbol: 'BTC', volume: '$1.2B' })];

    const { streamManager } = createMockStreamManager(allMarkets);

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    const { result } = renderHook(() => usePerpsLiveMarketData());

    expect(result.current.isInitialLoading).toBe(false);

    act(() => {
      result.current.refresh();
    });

    expect(
      (streamManager as unknown as { markets: { refresh: jest.Mock } }).markets
        .refresh,
    ).toHaveBeenCalled();
    expect(result.current.isInitialLoading).toBe(false);
  });

  it('excludes zero-volume HIP-3 markets from hip3Markets', () => {
    const allMarkets = [
      createMockMarket({
        symbol: 'abc:AAPL',
        volume: '$0',
        marketSource: 'abc',
      }),
      createMockMarket({
        symbol: 'xyz:TSLA',
        volume: '$50M',
        marketSource: 'xyz',
      }),
    ];

    const { streamManager } = createMockStreamManager(allMarkets);

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    const { result } = renderHook(() => usePerpsLiveMarketData());

    expect(result.current.hip3Markets).toHaveLength(1);
    expect(result.current.hip3Markets[0].symbol).toBe('xyz:TSLA');
  });

  it('sorts cryptoMarkets and hip3Markets by 24h volume descending', () => {
    const allMarkets = [
      createMockMarket({ symbol: 'DOGE', volume: '$50M' }),
      createMockMarket({ symbol: 'BTC', volume: '$1.2B' }),
      createMockMarket({ symbol: 'ETH', volume: '$850M' }),
      createMockMarket({
        symbol: 'xyz:GOOG',
        volume: '$80M',
        marketSource: 'xyz',
      }),
      createMockMarket({
        symbol: 'xyz:TSLA',
        volume: '$30M',
        marketSource: 'xyz',
      }),
      createMockMarket({
        symbol: 'xyz:NVDA',
        volume: '$200M',
        marketSource: 'xyz',
      }),
    ];

    const { streamManager } = createMockStreamManager(allMarkets);

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    const { result } = renderHook(() => usePerpsLiveMarketData());

    expect(result.current.cryptoMarkets.map((m) => m.symbol)).toEqual([
      'BTC',
      'ETH',
      'DOGE',
    ]);
    expect(result.current.hip3Markets.map((m) => m.symbol)).toEqual([
      'xyz:NVDA',
      'xyz:GOOG',
      'xyz:TSLA',
    ]);
  });
});
