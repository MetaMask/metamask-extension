import { renderHookWithProviderTyped } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import type { SortDirection } from '../../../../pages/perps/utils/sortMarkets';
import { PERPS_CONSTANTS } from '../constants';
import type { PerpsMarketData } from '../types';
import { usePerpsTopMovers } from './usePerpsTopMovers';

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

const MARKETS = [
  createMarket('BTC', '+1.00%'),
  createMarket('ETH', '+9.00%'),
  createMarket('SOL', '-4.00%'),
];

const renderTopMovers = (
  markets: PerpsMarketData[],
  direction: SortDirection,
) =>
  renderHookWithProviderTyped(
    () => usePerpsTopMovers({ markets, direction }),
    mockState,
  );

describe('usePerpsTopMovers', () => {
  it('ranks the biggest risers first when direction is desc', () => {
    const { result } = renderTopMovers(MARKETS, 'desc');

    expect(result.current.map((market) => market.symbol)).toStrictEqual([
      'ETH',
      'BTC',
      'SOL',
    ]);
  });

  it('ranks the biggest fallers first when direction is asc', () => {
    const { result } = renderTopMovers(MARKETS, 'asc');

    expect(result.current.map((market) => market.symbol)).toStrictEqual([
      'SOL',
      'BTC',
      'ETH',
    ]);
  });

  it('caps the ranking at the top movers limit', () => {
    const markets = Array.from(
      { length: PERPS_CONSTANTS.TOP_MOVERS_LIMIT + 5 },
      (_, index) => createMarket(`SYM${index}`, `+${index}.00%`),
    );

    const { result } = renderTopMovers(markets, 'desc');

    expect(result.current).toHaveLength(PERPS_CONSTANTS.TOP_MOVERS_LIMIT);
  });

  it('leaves the source market list untouched', () => {
    const markets = [
      createMarket('BTC', '+1.00%'),
      createMarket('ETH', '+9.00%'),
    ];

    renderTopMovers(markets, 'desc');

    expect(markets.map((market) => market.symbol)).toStrictEqual([
      'BTC',
      'ETH',
    ]);
  });

  it('returns an empty ranking when no markets are supplied', () => {
    const { result } = renderTopMovers([], 'desc');

    expect(result.current).toStrictEqual([]);
  });

  it('treats markets with no usable change value as zero change', () => {
    const markets = [
      createMarket('BTC', '--'),
      createMarket('ETH', '+9.00%'),
      createMarket('SOL', '-4.00%'),
    ];

    const { result } = renderTopMovers(markets, 'desc');

    expect(result.current.map((market) => market.symbol)).toStrictEqual([
      'ETH',
      'BTC',
      'SOL',
    ]);
  });
});
