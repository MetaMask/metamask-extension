import type { TrendingAsset } from '@metamask/assets-controllers';
import type { DiscoverSearchSection, DiscoverSearchSectionId } from './types';
import {
  normalizeStockName,
  normalizeStockTicker,
  orderDiscoverSearchSections,
  shouldPromoteStocksSection,
  stripLeadingDollarQuery,
} from './stocks-promotion';

const makeStockAsset = (
  overrides: Partial<TrendingAsset> = {},
): TrendingAsset =>
  ({
    assetId: 'eip155:1/erc20:0xtsla',
    symbol: 'TSLAon',
    name: 'Tesla (Ondo Tokenized)',
    decimals: 18,
    price: '250.00',
    rwaData: {
      ticker: 'TSLA',
      instrumentType: 'equity',
    },
    ...overrides,
  }) as unknown as TrendingAsset;

const makeStocksSection = (
  overrides: Partial<DiscoverSearchSection<TrendingAsset>> = {},
): DiscoverSearchSection<TrendingAsset> => ({
  id: 'stocks',
  items: [],
  isLoading: false,
  ...overrides,
});

describe('normalizeStockTicker', () => {
  it.each([
    ['TSLA', 'tsla'],
    ['tsla', 'tsla'],
    ['$TSLA', 'tsla'],
    ['  $tsla  ', 'tsla'],
    ['$ TSLA', 'tsla'],
    ['BRK B', 'brkb'],
    ['   ', ''],
    ['$', ''],
    ['', ''],
  ])('normalizes %p to %p', (input, expected) => {
    expect(normalizeStockTicker(input)).toBe(expected);
  });

  it('strips only a single leading dollar sign', () => {
    expect(normalizeStockTicker('$$TSLA')).toBe('$tsla');
  });
});

describe('normalizeStockName', () => {
  it.each([
    ['Tesla', 'tesla'],
    ['  TESLA  ', 'tesla'],
    ['Tesla   Motors', 'tesla motors'],
    ['   ', ''],
    ['', ''],
  ])('normalizes %p to %p', (input, expected) => {
    expect(normalizeStockName(input)).toBe(expected);
  });
});

describe('stripLeadingDollarQuery', () => {
  it.each([
    ['$TSLA', 'TSLA'],
    ['  $TSLA  ', 'TSLA'],
    ['$ tsla', 'tsla'],
    ['TSLA', 'TSLA'],
    ['  OUSG  ', 'OUSG'],
    ['$', ''],
    ['   ', ''],
    ['', ''],
    [undefined, ''],
  ])('strips %p to %p', (input, expected) => {
    expect(stripLeadingDollarQuery(input)).toBe(expected);
  });
});

describe('shouldPromoteStocksSection', () => {
  const loadedStocks = makeStocksSection({
    items: [makeStockAsset()],
    isLoading: false,
  });

  it.each(['TSLA', 'tsla', '$TSLA', '  $tsla  ', '$ TSLA', 'TsLa'])(
    'returns true for exact ticker match query %p',
    (query) => {
      expect(shouldPromoteStocksSection(query, loadedStocks)).toBe(true);
    },
  );

  it.each(['Tesla', 'tesla', '  TESLA  ', 'Tesla (Ondo Tokenized)'])(
    'returns true for exact name match query %p',
    (query) => {
      expect(shouldPromoteStocksSection(query, loadedStocks)).toBe(true);
    },
  );

  it('matches exact company name for xStock and plain-named RWAs', () => {
    const stocksSection = makeStocksSection({
      items: [
        makeStockAsset({
          assetId: 'eip155:1/erc20:0xmsft',
          symbol: 'MSFTx',
          name: 'Microsoft xStock',
          rwaData: {
            ticker: 'MSFT',
          } as unknown as TrendingAsset['rwaData'],
        }),
        makeStockAsset({
          assetId: 'eip155:1/erc20:0xaapl',
          symbol: 'AAPL',
          name: 'Apple',
          rwaData: {
            ticker: 'AAPL',
          } as unknown as TrendingAsset['rwaData'],
        }),
      ],
      isLoading: false,
    });

    expect(shouldPromoteStocksSection('Microsoft', stocksSection)).toBe(true);
    expect(shouldPromoteStocksSection('microsoft', stocksSection)).toBe(true);
    expect(shouldPromoteStocksSection('Apple', stocksSection)).toBe(true);
    expect(shouldPromoteStocksSection('Micro', stocksSection)).toBe(false);
    expect(shouldPromoteStocksSection('App', stocksSection)).toBe(false);
  });

  it.each(['TSL', 'tesl', 'eth', '', '   ', '$', '$$TSLA'])(
    'returns false for non-matching query %p',
    (query) => {
      expect(shouldPromoteStocksSection(query, loadedStocks)).toBe(false);
    },
  );

  it('returns false while Stocks is loading', () => {
    const loadingStocks = makeStocksSection({
      items: [makeStockAsset()],
      isLoading: true,
    });

    expect(shouldPromoteStocksSection('TSLA', loadingStocks)).toBe(false);
  });

  it('returns false when Stocks has no results', () => {
    const emptyStocks = makeStocksSection({
      items: [],
      isLoading: false,
    });

    expect(shouldPromoteStocksSection('TSLA', emptyStocks)).toBe(false);
  });

  it('returns false when Stocks section is missing', () => {
    expect(shouldPromoteStocksSection('TSLA', undefined)).toBe(false);
  });

  it('returns false when symbol matches but item has no rwaData', () => {
    const noRwaStocks = makeStocksSection({
      items: [
        makeStockAsset({
          symbol: 'TSLA',
          rwaData: undefined,
        }),
      ],
      isLoading: false,
    });

    expect(shouldPromoteStocksSection('TSLA', noRwaStocks)).toBe(false);
  });

  it('returns false when rwaData exists without ticker and name does not match', () => {
    const noTickerStocks = makeStocksSection({
      items: [
        makeStockAsset({
          symbol: 'TSLA',
          rwaData: {} as unknown as TrendingAsset['rwaData'],
        }),
      ],
      isLoading: false,
    });

    expect(shouldPromoteStocksSection('TSLA', noTickerStocks)).toBe(false);
  });

  it('matches when any stock item in the section has a matching rwaData.ticker', () => {
    const multiStocks = makeStocksSection({
      items: [
        makeStockAsset({
          assetId: 'eip155:1/erc20:0xaapl',
          symbol: 'AAPLon',
          name: 'Apple (Ondo Tokenized)',
          rwaData: {
            ticker: 'AAPL',
          } as unknown as TrendingAsset['rwaData'],
        }),
        makeStockAsset({
          assetId: 'eip155:1/erc20:0xtsla',
          symbol: 'TSLAon',
          name: 'Tesla (Ondo Tokenized)',
          rwaData: {
            ticker: 'TSLA',
          } as unknown as TrendingAsset['rwaData'],
        }),
      ],
      isLoading: false,
    });

    expect(shouldPromoteStocksSection('TSLA', multiStocks)).toBe(true);
  });
});

describe('orderDiscoverSearchSections', () => {
  const sectionIds: readonly DiscoverSearchSectionId[] = [
    'crypto',
    'perps',
    'stocks',
  ];

  it('moves stocks to index 0 while preserving relative order of other sections', () => {
    expect(orderDiscoverSearchSections(sectionIds, true)).toStrictEqual([
      'stocks',
      'crypto',
      'perps',
    ]);
  });

  it('returns the original array reference when shouldPromote is false', () => {
    expect(orderDiscoverSearchSections(sectionIds, false)).toBe(sectionIds);
  });

  it('returns the original array reference when stocks is missing or already first', () => {
    const withoutStocks: readonly DiscoverSearchSectionId[] = [
      'crypto',
      'perps',
    ];
    expect(orderDiscoverSearchSections(withoutStocks, true)).toBe(
      withoutStocks,
    );

    const stocksFirst: readonly DiscoverSearchSectionId[] = [
      'stocks',
      'crypto',
    ];
    expect(orderDiscoverSearchSections(stocksFirst, true)).toBe(stocksFirst);
  });
});
