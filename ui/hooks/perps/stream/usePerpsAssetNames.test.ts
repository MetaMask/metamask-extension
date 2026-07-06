import { renderHook, act } from '@testing-library/react-hooks';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { usePerpsAssetNames } from './usePerpsAssetNames';
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

describe('usePerpsAssetNames', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves a symbol to its full asset name', () => {
    const { streamManager } = createMockStreamManager([
      createMockMarket({ symbol: 'BTC', name: 'Bitcoin' }),
      createMockMarket({ symbol: 'ETH', name: 'Ethereum' }),
    ]);

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    const { result } = renderHook(() => usePerpsAssetNames());

    expect(result.current.resolveAssetName('BTC')).toBe('Bitcoin');
    expect(result.current.resolveAssetName('ETH')).toBe('Ethereum');
  });

  it('matches symbols case-insensitively', () => {
    const { streamManager } = createMockStreamManager([
      createMockMarket({ symbol: 'BTC', name: 'Bitcoin' }),
    ]);

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    const { result } = renderHook(() => usePerpsAssetNames());

    expect(result.current.resolveAssetName('btc')).toBe('Bitcoin');
  });

  it('falls back to the stripped ticker for unknown symbols', () => {
    const { streamManager } = createMockStreamManager([
      createMockMarket({ symbol: 'BTC', name: 'Bitcoin' }),
    ]);

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    const { result } = renderHook(() => usePerpsAssetNames());

    // Unknown plain symbol returns as-is
    expect(result.current.resolveAssetName('DOGE')).toBe('DOGE');
    // Unknown HIP-3 symbol has its DEX prefix stripped
    expect(result.current.resolveAssetName('xyz:TSLA')).toBe('TSLA');
  });

  it('includes low-volume markets that the live market hook filters out', () => {
    const { streamManager } = createMockStreamManager([
      createMockMarket({ symbol: 'ZERO', name: 'Zero Vol', volume: '$0' }),
    ]);

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    const { result } = renderHook(() => usePerpsAssetNames());

    expect(result.current.resolveAssetName('ZERO')).toBe('Zero Vol');
  });

  it('updates the resolver when new markets stream in', () => {
    const { streamManager, pushMarkets } = createMockStreamManager([
      createMockMarket({ symbol: 'BTC', name: 'Bitcoin' }),
    ]);

    usePerpsStreamManagerMock.mockReturnValue({
      streamManager,
      isInitializing: false,
      error: null,
      selectedAddress: '0x123',
    });

    const { result } = renderHook(() => usePerpsAssetNames());

    expect(result.current.resolveAssetName('SOL')).toBe('SOL');

    act(() => {
      pushMarkets([
        createMockMarket({ symbol: 'BTC', name: 'Bitcoin' }),
        createMockMarket({ symbol: 'SOL', name: 'Solana' }),
      ]);
    });

    expect(result.current.resolveAssetName('SOL')).toBe('Solana');
  });

  it('returns the ticker fallback when the stream manager is not ready', () => {
    usePerpsStreamManagerMock.mockReturnValue({
      streamManager: null,
      isInitializing: true,
      error: null,
      selectedAddress: '0x123',
    });

    const { result } = renderHook(() => usePerpsAssetNames());

    expect(result.current.resolveAssetName('BTC')).toBe('BTC');
  });
});
