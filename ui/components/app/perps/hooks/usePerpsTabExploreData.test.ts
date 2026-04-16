import { act } from '@testing-library/react-hooks';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { mockCryptoMarkets, mockHip3Markets } from '../mocks';
import { PERPS_CONSTANTS } from '../constants';
import {
  usePerpsLiveMarketData,
  usePerpsLivePrices,
} from '../../../../hooks/perps/stream';
import { usePerpsTabExploreData } from './usePerpsTabExploreData';

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLiveMarketData: jest.fn(),
  usePerpsLivePrices: jest.fn(),
}));

describe('usePerpsTabExploreData', () => {
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    jest.mocked(usePerpsLiveMarketData).mockReturnValue({
      markets: [...mockCryptoMarkets, ...mockHip3Markets],
      cryptoMarkets: mockCryptoMarkets,
      hip3Markets: mockHip3Markets,
      isInitialLoading: false,
      error: null,
      refresh: mockRefresh,
    });
    jest.mocked(usePerpsLivePrices).mockReturnValue({
      prices: {},
      isInitialLoading: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns explore preview markets and watchlist markets from the same live source', () => {
    const { result } = renderHookWithProvider(() => usePerpsTabExploreData(), {
      metamask: {
        ...mockState.metamask,
        isTestnet: false,
        watchlistMarkets: {
          mainnet: ['BTC', 'ETH'],
          testnet: [],
        },
      },
    });

    expect(result.current.exploreMarkets).toHaveLength(
      PERPS_CONSTANTS.EXPLORE_MARKETS_LIMIT,
    );
    expect(result.current.exploreMarkets[0].symbol).toBe('BTC');
    expect(
      result.current.watchlistMarkets.map((market) => market.symbol),
    ).toEqual(['BTC', 'ETH']);
  });

  it('overlays live price updates onto tab markets', () => {
    jest.mocked(usePerpsLivePrices).mockReturnValue({
      prices: {
        BTC: {
          symbol: 'BTC',
          price: '99999',
          percentChange24h: '12.34',
          timestamp: 1,
        },
      },
      isInitialLoading: false,
    });

    const { result } = renderHookWithProvider(() => usePerpsTabExploreData(), {
      metamask: {
        ...mockState.metamask,
        isTestnet: false,
        watchlistMarkets: {
          mainnet: ['BTC'],
          testnet: [],
        },
      },
    });

    expect(result.current.exploreMarkets[0].price).toBe('99999');
    expect(result.current.exploreMarkets[0].change24hPercent).toBe('12.34');
    expect(result.current.watchlistMarkets[0].price).toBe('99999');
  });

  it('refreshes snapshot-backed market fields on an interval', () => {
    renderHookWithProvider(() => usePerpsTabExploreData(), {
      metamask: {
        ...mockState.metamask,
        isTestnet: false,
        watchlistMarkets: {
          mainnet: ['BTC'],
          testnet: [],
        },
      },
    });

    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
