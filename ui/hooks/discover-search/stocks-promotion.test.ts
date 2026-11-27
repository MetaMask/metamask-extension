import { it } from '@jest/globals';
import type { TrendingAsset } from '@metamask/assets-controllers';
import type { DiscoverSearchSection, DiscoverSearchSectionId } from './types';
import {
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

  it.each([
    ['TSLA', true],
    ['tsla', true],
    ['$TSLA', true],
    ['  $tsla  ', true],
    ['$ TSLA', true],
    ['Tesla', true],
    ['Tesla (Ondo Tokenized)', true],
    ['TSL', false],
    ['tesl', false],
    ['eth', false],
    ['', false],
    ['$', false],
    ['$$TSLA', false],
  ])('returns %p for query %p', (query, expected) => {
    expect(shouldPromoteStocksSection(query, loadedStocks)).toBe(expected);
  });

  it('matches exact company name for xStock and plain-named RWAs', () => {
    const stocksSection = makeStocksSection({
      items: [
        makeStockAsset({
          name: 'Microsoft xStock',
          rwaData: {
            ticker: 'MSFT',
          } as unknown as TrendingAsset['rwaData'],
        }),
        makeStockAsset({
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

  it('does not promote while loading, when empty, missing RWA data, or without a ticker', () => {
    const sections = [
      makeStocksSection({ items: [makeStockAsset()], isLoading: true }),
      makeStocksSection(),
      makeStocksSection({
        items: [makeStockAsset({ rwaData: undefined })],
      }),
      makeStocksSection({
        items: [
          makeStockAsset({
            rwaData: {} as unknown as TrendingAsset['rwaData'],
          }),
        ],
      }),
      undefined,
    ];

    sections.forEach((section) => {
      expect(shouldPromoteStocksSection('TSLA', section)).toBe(false);
    });
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

  it.each([
    [sectionIds, false],
    [['crypto', 'perps'] as const, true],
    [['stocks', 'crypto'] as const, true],
  ])(
    'preserves the original array when no reorder is needed',
    (sections, promote) => {
      expect(orderDiscoverSearchSections(sections, promote)).toBe(sections);
    },
  );
});
