import { renderHookWithProviderTyped } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import type { PerpsMarketData } from '../types';
import { usePerpsMarketCategories } from './usePerpsMarketCategories';

const createMarket = (
  symbol: string,
  overrides: Partial<PerpsMarketData> = {},
): PerpsMarketData =>
  ({
    symbol,
    name: symbol,
    maxLeverage: '20x',
    price: '$1.00',
    change24h: '+$0.00',
    change24hPercent: '+1.00%',
    volume: '$1M',
    ...overrides,
  }) as PerpsMarketData;

/** Main-DEX asset: no `marketSource`, so the controller buckets it as crypto. */
const CRYPTO_MARKET = createMarket('BTC');

const createHip3Market = (
  symbol: string,
  marketType: string,
): PerpsMarketData =>
  createMarket(symbol, {
    marketSource: 'xyz',
    isHip3: true,
    marketType,
  } as Partial<PerpsMarketData>);

const renderCategories = (markets: PerpsMarketData[]) =>
  renderHookWithProviderTyped(
    () => usePerpsMarketCategories(markets),
    mockState,
  );

describe('usePerpsMarketCategories', () => {
  it('returns only the all shortcut when there are no markets', () => {
    const { result } = renderCategories([]);

    expect(result.current).toStrictEqual(['all']);
  });

  it('lists all first, then every category present in the markets', () => {
    const { result } = renderCategories([
      createHip3Market('xyz:XAU', 'commodity'),
      CRYPTO_MARKET,
      createHip3Market('xyz:TSLA', 'stock'),
    ]);

    expect(result.current).toStrictEqual([
      'all',
      'crypto',
      'stock',
      'commodity',
    ]);
  });

  it('omits a category no market falls into', () => {
    const { result } = renderCategories([CRYPTO_MARKET]);

    expect(result.current).toStrictEqual(['all', 'crypto']);
  });

  it('reports a category once no matter how many markets carry it', () => {
    const { result } = renderCategories([
      createHip3Market('xyz:TSLA', 'stock'),
      createHip3Market('xyz:AAPL', 'stock'),
    ]);

    expect(result.current).toStrictEqual(['all', 'stock']);
  });

  it('buckets a main-DEX market as crypto rather than a HIP-3 category', () => {
    const { result } = renderCategories([
      createMarket('HYPE', { marketSource: undefined }),
    ]);

    expect(result.current).toStrictEqual(['all', 'crypto']);
  });

  it('keeps the same array across renders when the markets are unchanged', () => {
    const markets = [CRYPTO_MARKET];
    const { result, rerender } = renderCategories(markets);
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
