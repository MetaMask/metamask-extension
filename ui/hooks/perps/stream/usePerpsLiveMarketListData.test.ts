import { it } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { usePerpsLiveMarketData } from './usePerpsLiveMarketData';
import { usePerpsLiveMarketListData } from './usePerpsLiveMarketListData';
import { usePerpsLivePrices } from './usePerpsLivePrices';

const mockHasLiveMarketData = jest.fn();
jest.mock('../../../providers/perps/PerpsStreamManager', () => ({
  getPerpsStreamManager: () => ({ hasLiveMarketData: mockHasLiveMarketData }),
}));

jest.mock('./usePerpsLiveMarketData', () => ({
  usePerpsLiveMarketData: jest.fn(),
}));
jest.mock('./usePerpsLivePrices', () => ({ usePerpsLivePrices: jest.fn() }));

const mockUsePerpsLiveMarketData =
  usePerpsLiveMarketData as jest.MockedFunction<typeof usePerpsLiveMarketData>;
const mockUsePerpsLivePrices = usePerpsLivePrices as jest.MockedFunction<
  typeof usePerpsLivePrices
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

describe('usePerpsLiveMarketListData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([false, true])(
    'requires live metadata and live prices together when pricesLive=%s',
    (pricesLive) => {
      const markets = [createMockMarket()];
      mockHasLiveMarketData.mockReturnValue(false);
      mockUsePerpsLiveMarketData.mockReturnValue({
        markets,
        cryptoMarkets: markets,
        hip3Markets: [],
        isInitialLoading: false,
        error: null,
        refresh: jest.fn(),
      });
      mockUsePerpsLivePrices.mockReturnValue({
        isLive: pricesLive,
        prices: {
          BTC: {
            symbol: 'BTC',
            price: '51000',
            timestamp: 1,
            isTradable: true,
          },
        },
        isInitialLoading: false,
      });
      const { result, rerender } = renderHook(() =>
        usePerpsLiveMarketListData(),
      );
      expect(result.current.isLive).toBe(false);

      mockHasLiveMarketData.mockReturnValue(true);
      // A live notification supplies a new immutable market snapshot.
      mockUsePerpsLiveMarketData.mockReturnValue({
        ...mockUsePerpsLiveMarketData.mock.results[0].value,
        markets: [...markets],
      });
      rerender();

      expect(result.current.isLive).toBe(pricesLive);
      if (pricesLive) {
        expect(mockHasLiveMarketData).toHaveBeenCalledWith(markets);
      }
    },
  );

  it('requires a live price for each rendered market rather than an offscreen quote', () => {
    const markets = [createMockMarket(), createMockMarket({ symbol: 'SOL' })];
    mockHasLiveMarketData.mockReturnValue(true);
    mockUsePerpsLiveMarketData.mockReturnValue({
      markets,
      cryptoMarkets: markets,
      hip3Markets: [],
      isInitialLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    const sol = { symbol: 'SOL', price: '150', timestamp: 1, isTradable: true };
    mockUsePerpsLivePrices.mockReturnValue({
      isLive: true,
      prices: { SOL: sol },
      isInitialLoading: false,
    });
    const { result, rerender } = renderHook(() => usePerpsLiveMarketListData());
    const staleRenderedBtc = result.current.markets[0];

    expect(result.current.areMarketsLive([staleRenderedBtc])).toBe(false);
    expect(result.current.areMarketsLive([result.current.markets[1]])).toBe(
      true,
    );
    expect(result.current.areMarketsLive([])).toBe(false);

    mockUsePerpsLivePrices.mockReturnValue({
      isLive: true,
      prices: {
        SOL: sol,
        BTC: { symbol: 'BTC', price: '51000', timestamp: 2, isTradable: true },
      },
      isInitialLoading: false,
    });
    rerender();

    expect(result.current.areMarketsLive(result.current.markets)).toBe(true);
    expect(result.current.areMarketsLive([staleRenderedBtc])).toBe(false);
  });

  it.each(['0', '-1', 'NaN', 'Infinity'])(
    'rejects the rendered market with invalid live price %s',
    (price) => {
      const markets = [createMockMarket()];
      mockHasLiveMarketData.mockReturnValue(true);
      mockUsePerpsLiveMarketData.mockReturnValue({
        markets,
        cryptoMarkets: markets,
        hip3Markets: [],
        isInitialLoading: false,
        error: null,
        refresh: jest.fn(),
      });
      mockUsePerpsLivePrices.mockReturnValue({
        isLive: true,
        prices: {
          BTC: { symbol: 'BTC', price, timestamp: 1, isTradable: true },
        },
        isInitialLoading: false,
      });
      const { result } = renderHook(() => usePerpsLiveMarketListData());
      expect(result.current.areMarketsLive(result.current.markets)).toBe(false);
    },
  );

  it('activates live prices for all current market symbols', () => {
    const markets = [
      createMockMarket({ symbol: 'BTC' }),
      createMockMarket({ symbol: 'ETH' }),
    ];

    mockUsePerpsLiveMarketData.mockReturnValue({
      markets,
      cryptoMarkets: markets,
      hip3Markets: [],
      isInitialLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    mockUsePerpsLivePrices.mockReturnValue({
      isLive: false,
      prices: {},
      isInitialLoading: false,
    });

    renderHook(() => usePerpsLiveMarketListData());

    expect(mockUsePerpsLivePrices).toHaveBeenCalledWith({
      symbols: ['BTC', 'ETH'],
      activateStream: true,
      includeMarketData: false,
    });
  });

  it('does not activate live market streams when disabled', () => {
    const refresh = jest.fn();
    const market = createMockMarket({ symbol: 'BTC' });

    mockUsePerpsLiveMarketData.mockReturnValue({
      markets: [market],
      cryptoMarkets: [market],
      hip3Markets: [],
      isInitialLoading: false,
      error: null,
      refresh,
    });
    mockUsePerpsLivePrices.mockReturnValue({
      isLive: false,
      prices: {},
      isInitialLoading: false,
    });

    renderHook(() => usePerpsLiveMarketListData({ activateStream: false }));

    expect(mockUsePerpsLiveMarketData).toHaveBeenCalledWith({
      autoSubscribe: false,
    });
    expect(mockUsePerpsLivePrices).toHaveBeenCalledWith({
      symbols: ['BTC'],
      activateStream: false,
      includeMarketData: false,
    });

    jest.advanceTimersByTime(30000);

    expect(refresh).not.toHaveBeenCalled();
  });

  it('overlays live price and 24h change onto the market list', () => {
    const market = createMockMarket({ symbol: 'BTC' });

    mockUsePerpsLiveMarketData.mockReturnValue({
      markets: [market],
      cryptoMarkets: [market],
      hip3Markets: [],
      isInitialLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    mockUsePerpsLivePrices.mockReturnValue({
      isLive: false,
      prices: {
        BTC: {
          symbol: 'BTC',
          // Raw price string from PriceUpdate (no $ prefix, no commas)
          price: '78337.5',
          percentChange24h: '+9.9%',
          timestamp: 123,
          isTradable: true,
        },
      },
      isInitialLoading: false,
    });

    const { result } = renderHook(() => usePerpsLiveMarketListData());

    expect(result.current.markets[0]).toMatchObject({
      symbol: 'BTC',
      // Formatted via formatPerpsFiatUniversal: $10k-$100k range → 0 decimals
      price: '$78,338',
      change24hPercent: '+9.9%',
    });
  });

  it('refreshes market snapshots on an interval while markets are present', () => {
    const refresh = jest.fn();
    const market = createMockMarket({ symbol: 'BTC' });

    mockUsePerpsLiveMarketData.mockReturnValue({
      markets: [market],
      cryptoMarkets: [market],
      hip3Markets: [],
      isInitialLoading: false,
      error: null,
      refresh,
    });
    mockUsePerpsLivePrices.mockReturnValue({
      isLive: false,
      prices: {},
      isInitialLoading: false,
    });

    renderHook(() => usePerpsLiveMarketListData());

    jest.advanceTimersByTime(30000);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('keeps derived market arrays stable when inputs are unchanged', () => {
    const refresh = jest.fn();
    const cryptoMarket = createMockMarket({ symbol: 'BTC' });
    const hip3Market = createMockMarket({
      symbol: 'xyz:TSLA',
      marketSource: 'xyz',
    });

    mockUsePerpsLiveMarketData.mockReturnValue({
      markets: [cryptoMarket, hip3Market],
      cryptoMarkets: [cryptoMarket],
      hip3Markets: [hip3Market],
      isInitialLoading: false,
      error: null,
      refresh,
    });
    mockUsePerpsLivePrices.mockReturnValue({
      isLive: false,
      prices: {},
      isInitialLoading: false,
    });

    const { result, rerender } = renderHook(() => usePerpsLiveMarketListData());

    const firstCryptoMarkets = result.current.cryptoMarkets;
    const firstHip3Markets = result.current.hip3Markets;

    rerender();

    expect(result.current.cryptoMarkets).toBe(firstCryptoMarkets);
    expect(result.current.hip3Markets).toBe(firstHip3Markets);
  });
});
