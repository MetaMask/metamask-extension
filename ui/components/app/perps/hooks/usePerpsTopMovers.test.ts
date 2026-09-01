import { renderHookWithProviderTyped } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { usePerpsLiveMarketListData } from '../../../../hooks/perps/stream';
import type { SortDirection } from '../../../../pages/perps/utils/sortMarkets';
import { PERPS_CONSTANTS } from '../constants';
import type { PerpsMarketData } from '../types';
import { usePerpsTopMovers } from './usePerpsTopMovers';

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLiveMarketListData: jest.fn(),
}));

const mockUsePerpsLiveMarketListData = jest.mocked(usePerpsLiveMarketListData);

const createMarket = (
  symbol: string,
  change24hPercent: string,
): PerpsMarketData =>
  ({
    symbol,
    name: symbol,
    maxLeverage: '20x',
    price: '$1.00',
    change24h: '+$0.00',
    change24hPercent,
    volume: '$1M',
  }) as PerpsMarketData;

const setLiveMarkets = (
  markets: PerpsMarketData[],
  isInitialLoading = false,
) => {
  mockUsePerpsLiveMarketListData.mockReturnValue({
    markets,
    isInitialLoading,
  } as ReturnType<typeof usePerpsLiveMarketListData>);
};

const renderTopMovers = (direction: SortDirection) =>
  renderHookWithProviderTyped(
    () => usePerpsTopMovers({ direction }),
    mockState,
  );

describe('usePerpsTopMovers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ranks the biggest risers first when direction is desc', () => {
    setLiveMarkets([
      createMarket('BTC', '+1.00%'),
      createMarket('ETH', '+9.00%'),
      createMarket('SOL', '-4.00%'),
    ]);

    const { result } = renderTopMovers('desc');

    expect(result.current.markets.map((market) => market.symbol)).toStrictEqual(
      ['ETH', 'BTC', 'SOL'],
    );
  });

  it('ranks the biggest fallers first when direction is asc', () => {
    setLiveMarkets([
      createMarket('BTC', '+1.00%'),
      createMarket('ETH', '+9.00%'),
      createMarket('SOL', '-4.00%'),
    ]);

    const { result } = renderTopMovers('asc');

    expect(result.current.markets.map((market) => market.symbol)).toStrictEqual(
      ['SOL', 'BTC', 'ETH'],
    );
  });

  it('caps the ranking at the top movers limit', () => {
    const markets = Array.from(
      { length: PERPS_CONSTANTS.TOP_MOVERS_LIMIT + 5 },
      (_, index) => createMarket(`SYM${index}`, `+${index}.00%`),
    );
    setLiveMarkets(markets);

    const { result } = renderTopMovers('desc');

    expect(result.current.markets).toHaveLength(
      PERPS_CONSTANTS.TOP_MOVERS_LIMIT,
    );
  });

  it('leaves the source market list untouched', () => {
    const markets = [
      createMarket('BTC', '+1.00%'),
      createMarket('ETH', '+9.00%'),
    ];
    setLiveMarkets(markets);

    renderTopMovers('desc');

    expect(markets.map((market) => market.symbol)).toStrictEqual([
      'BTC',
      'ETH',
    ]);
  });

  it('reports the stream initial loading state', () => {
    setLiveMarkets([], true);

    const { result } = renderTopMovers('desc');

    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.markets).toStrictEqual([]);
  });

  it('treats markets with no usable change value as zero change', () => {
    setLiveMarkets([
      createMarket('BTC', '--'),
      createMarket('ETH', '+9.00%'),
      createMarket('SOL', '-4.00%'),
    ]);

    const { result } = renderTopMovers('desc');

    expect(result.current.markets.map((market) => market.symbol)).toStrictEqual(
      ['ETH', 'BTC', 'SOL'],
    );
  });
});
