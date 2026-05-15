import { renderHook } from '@testing-library/react-hooks';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { usePerpsLiveMarketData } from './usePerpsLiveMarketData';
import { usePerpsLiveMarketListData } from './usePerpsLiveMarketListData';
import { usePerpsLivePrices } from './usePerpsLivePrices';

jest.mock('./usePerpsLiveMarketData');
jest.mock('./usePerpsLivePrices');

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
      prices: {
        BTC: {
          symbol: 'BTC',
          // Raw price string from PriceUpdate (no $ prefix, no commas)
          price: '78337.5',
          percentChange24h: '+9.9%',
          timestamp: 123,
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
