import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import type { PerpsMarketData } from '@metamask/perps-controller';

import { usePerpsLiveMarketListData } from '../perps/stream/usePerpsLiveMarketListData';
import { useDiscoverPerpsSearch } from './useDiscoverPerpsSearch';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../perps/stream/usePerpsLiveMarketListData', () => ({
  usePerpsLiveMarketListData: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);
const mockUsePerpsLiveMarketListData = jest.mocked(usePerpsLiveMarketListData);

const createMarket = (overrides: Partial<PerpsMarketData>): PerpsMarketData =>
  ({
    symbol: 'BTC',
    name: 'Bitcoin',
    change24hPercent: '0',
    ...overrides,
  }) as PerpsMarketData;

describe('useDiscoverPerpsSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockReturnValue(true);
    mockUsePerpsLiveMarketListData.mockReturnValue({
      markets: [],
      cryptoMarkets: [],
      hip3Markets: [],
      isInitialLoading: false,
      error: null,
      refresh: jest.fn(),
    });
  });

  it('sorts an empty query by 24-hour price change descending', () => {
    mockUsePerpsLiveMarketListData.mockReturnValue({
      markets: [
        createMarket({ symbol: 'LOW', change24hPercent: '-2.5%' }),
        createMarket({ symbol: 'HIGH', change24hPercent: '+10%' }),
        createMarket({ symbol: 'MID', change24hPercent: '+1.5%' }),
      ],
      cryptoMarkets: [],
      hip3Markets: [],
      isInitialLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { result } = renderHook(() => useDiscoverPerpsSearch({ query: '' }));

    expect(result.current.data.map(({ symbol }) => symbol)).toStrictEqual([
      'HIGH',
      'MID',
      'LOW',
    ]);
  });

  it('uses Fuse relevance ordering for nonempty queries', () => {
    mockUsePerpsLiveMarketListData.mockReturnValue({
      markets: [
        createMarket({ symbol: 'xyz:ETH', name: 'Ethereum' }),
        createMarket({ symbol: 'ETH', name: 'Ethereum' }),
        createMarket({ symbol: 'ETHFI', name: 'Ether.fi' }),
      ],
      cryptoMarkets: [],
      hip3Markets: [],
      isInitialLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { result } = renderHook(() =>
      useDiscoverPerpsSearch({ query: 'ETH' }),
    );

    expect(result.current.data.map(({ symbol }) => symbol)).toStrictEqual([
      'ETH',
      'ETHFI',
      'xyz:ETH',
    ]);
  });

  it('returns the locally filtered result count', () => {
    mockUsePerpsLiveMarketListData.mockReturnValue({
      markets: [
        createMarket({ symbol: 'ETH', name: 'Ethereum' }),
        createMarket({ symbol: 'ETHFI', name: 'Ether.fi' }),
        createMarket({ symbol: 'BTC', name: 'Bitcoin' }),
      ],
      cryptoMarkets: [],
      hip3Markets: [],
      isInitialLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { result } = renderHook(() =>
      useDiscoverPerpsSearch({ query: 'eth' }),
    );

    expect(result.current.data).toHaveLength(2);
    expect(result.current.totalCount).toBe(2);
  });

  it('finds markets by Terminal-enriched names', () => {
    mockUsePerpsLiveMarketListData.mockReturnValue({
      markets: [createMarket({ symbol: 'ENS', name: 'Ethereum Name Service' })],
      cryptoMarkets: [],
      hip3Markets: [],
      isInitialLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { result } = renderHook(() =>
      useDiscoverPerpsSearch({ query: 'Name Service' }),
    );

    expect(
      result.current.data.map(({ symbol, name }) => ({ symbol, name })),
    ).toStrictEqual([{ symbol: 'ENS', name: 'Ethereum Name Service' }]);
  });
});
