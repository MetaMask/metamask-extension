import type { PerpsMarketData } from '@metamask/perps-controller';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { mockCryptoMarkets, mockHip3Markets } from '../mocks';
import { PERPS_CONSTANTS } from '../constants';
import { usePerpsLiveMarketListData } from '../../../../hooks/perps/stream';
import { usePerpsTabExploreData } from './usePerpsTabExploreData';

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLiveMarketListData: jest.fn(),
}));

describe('usePerpsTabExploreData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(usePerpsLiveMarketListData).mockReturnValue({
      markets: [...mockCryptoMarkets, ...mockHip3Markets],
      cryptoMarkets: mockCryptoMarkets,
      hip3Markets: mockHip3Markets,
      isInitialLoading: false,
      error: null,
      refresh: jest.fn(),
    });
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
      result.current.watchlistMarkets.map(
        (market: PerpsMarketData) => market.symbol,
      ),
    ).toEqual(['BTC', 'ETH']);
  });

  it('derives tab markets from the live market list contract', () => {
    jest.mocked(usePerpsLiveMarketListData).mockReturnValue({
      markets: [
        {
          ...mockCryptoMarkets[0],
          price: '99999',
          change24hPercent: '12.34',
        },
        ...mockCryptoMarkets.slice(1),
        ...mockHip3Markets,
      ],
      cryptoMarkets: mockCryptoMarkets,
      hip3Markets: mockHip3Markets,
      isInitialLoading: false,
      error: null,
      refresh: jest.fn(),
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

  it('preserves the user watchlist symbol order', () => {
    const { result } = renderHookWithProvider(() => usePerpsTabExploreData(), {
      metamask: {
        ...mockState.metamask,
        isTestnet: false,
        watchlistMarkets: {
          mainnet: ['ETH', 'BTC'],
          testnet: [],
        },
      },
    });

    expect(
      result.current.watchlistMarkets.map(
        (market: PerpsMarketData) => market.symbol,
      ),
    ).toEqual(['ETH', 'BTC']);
  });
});
