import type { Asset } from '@metamask/assets-controllers';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import type { CaipChainId, Hex } from '@metamask/utils';
import {
  compareFiatBalanceDescending,
  sortAssetsWithPriority,
  sortTokenAssets,
} from './sortAssetsWithPriority';

function createMockAsset({
  name,
  fiatBalance,
  isNative = true,
  chainId = CHAIN_IDS.MAINNET,
}: {
  name: string;
  fiatBalance?: number;
  isNative?: boolean;
  chainId?: Hex | CaipChainId;
}): Asset {
  return {
    name,
    fiat: fiatBalance === undefined ? undefined : { balance: fiatBalance },
    isNative,
    chainId,
  } as unknown as Asset;
}

describe('sortAssetsWithPriority', () => {
  function extractAssetNames(assets: Asset[]): string[] {
    return assets.map((asset) => asset.name);
  }

  it('sorts by name when key is "name"', () => {
    const assets = [
      createMockAsset({ name: 'Asset B', fiatBalance: 400 }),
      createMockAsset({ name: 'Asset A', fiatBalance: 600 }),
      createMockAsset({ name: 'Asset Z', fiatBalance: 500 }),
    ];

    const sortedAssets = sortAssetsWithPriority(assets, {
      key: 'name',
      order: 'asc',
      sortCallback: 'alphaNumeric',
    });

    expect(extractAssetNames(sortedAssets)).toStrictEqual([
      'Asset A',
      'Asset B',
      'Asset Z',
    ]);
  });

  it('sorts by name when key is "title"', () => {
    const assets = [
      createMockAsset({ name: 'Asset B', fiatBalance: 400 }),
      createMockAsset({ name: 'Asset A', fiatBalance: 600 }),
      createMockAsset({ name: 'Asset Z', fiatBalance: 500 }),
    ];

    const sortedAssets = sortAssetsWithPriority(assets, {
      key: 'title',
      order: 'asc',
      sortCallback: 'alphaNumeric',
    });

    expect(extractAssetNames(sortedAssets)).toStrictEqual([
      'Asset A',
      'Asset B',
      'Asset Z',
    ]);
  });

  it('sorts by fiat balance when key is "tokenFiatAmount"', () => {
    const assets = [
      createMockAsset({ name: 'Asset B', fiatBalance: 400 }),
      createMockAsset({ name: 'Asset A', fiatBalance: 600 }),
      createMockAsset({ name: 'Asset Z', fiatBalance: 500 }),
    ];

    const sortedAssets = sortAssetsWithPriority(assets, {
      key: 'tokenFiatAmount',
      order: 'dsc',
      sortCallback: 'stringNumeric',
    });

    expect(extractAssetNames(sortedAssets)).toStrictEqual([
      'Asset A',
      'Asset Z',
      'Asset B',
    ]);
  });
});

describe('sortTokenAssets', () => {
  const assets = [
    createMockAsset({ name: 'Asset B', fiatBalance: 400 }),
    createMockAsset({ name: 'Asset A', fiatBalance: 600 }),
    createMockAsset({ name: 'Asset Z', fiatBalance: 100 }),
  ];
  const savedBalanceSort = {
    key: 'tokenFiatAmount',
    order: 'dsc' as const,
    sortCallback: 'stringNumeric' as const,
  };
  const names = ['Asset A', 'Asset B', 'Asset Z'];

  it.each([
    {
      label: 'token names from A to Z',
      column: 'token' as const,
      reversed: false,
      expected: names,
    },
    {
      label: 'token names from Z to A',
      column: 'token' as const,
      reversed: true,
      expected: [...names].reverse(),
    },
    {
      label: 'the highest balance first',
      column: 'balance' as const,
      reversed: false,
      expected: names,
    },
    {
      label: 'the lowest balance first',
      column: 'balance' as const,
      reversed: true,
      expected: [...names].reverse(),
    },
    {
      label: 'a native asset ahead of a token when balances are equal',
      column: 'balance' as const,
      reversed: true,
      list: [
        createMockAsset({ name: 'Token', fiatBalance: 10, isNative: false }),
        createMockAsset({ name: 'Native', fiatBalance: 10, isNative: true }),
      ],
      expected: ['Native', 'Token'],
    },
    {
      label: 'the highest price first and a missing price last',
      column: 'price' as const,
      reversed: false,
      values: { 'Asset A': 2, 'Asset B': 10 },
      expected: ['Asset B', 'Asset A', 'Asset Z'],
    },
    {
      label: 'the lowest price first and a missing price last',
      column: 'price' as const,
      reversed: true,
      values: { 'Asset A': 2, 'Asset B': 10 },
      expected: ['Asset A', 'Asset B', 'Asset Z'],
    },
    {
      label: 'the largest 24h gain first and a missing change last',
      column: 'change' as const,
      reversed: false,
      values: { 'Asset A': -2, 'Asset B': 4 },
      expected: ['Asset B', 'Asset A', 'Asset Z'],
    },
    {
      label: 'the largest 24h loss first and a missing change last',
      column: 'change' as const,
      reversed: true,
      values: { 'Asset A': -2, 'Asset B': 4 },
      expected: ['Asset A', 'Asset B', 'Asset Z'],
    },
    {
      label: 'missing prices by name',
      column: 'price' as const,
      reversed: false,
      values: {},
      expected: names,
    },
    {
      label: 'missing prices by name when reversed',
      column: 'price' as const,
      reversed: true,
      values: {},
      expected: names,
    },
    {
      label: 'non-finite prices last',
      column: 'price' as const,
      reversed: false,
      values: {
        'Asset A': Number.NaN,
        'Asset B': Number.POSITIVE_INFINITY,
        'Asset Z': 1,
      },
      expected: ['Asset Z', 'Asset A', 'Asset B'],
    },
    {
      label: 'non-finite prices last when reversed',
      column: 'price' as const,
      reversed: true,
      values: {
        'Asset A': Number.NaN,
        'Asset B': Number.POSITIVE_INFINITY,
        'Asset Z': 1,
      },
      expected: ['Asset Z', 'Asset A', 'Asset B'],
    },
    {
      label: 'equal prices by name',
      column: 'price' as const,
      reversed: true,
      values: { 'Asset A': 5, 'Asset B': 5, 'Asset Z': 5 },
      expected: names,
    },
  ])('sorts $label', ({ column, reversed, values, list, expected }) => {
    const sortedNames = sortTokenAssets(
      list ?? assets,
      savedBalanceSort,
      column === 'price' || column === 'change'
        ? {
            column,
            reversed,
            getValue: (asset) => values[asset.name],
          }
        : { column, reversed },
    ).map((asset) => asset.name);

    expect(sortedNames).toStrictEqual(expected);
  });
});

describe('compareFiatBalanceDescending', () => {
  describe('fiat balance comparison', () => {
    it('compares second value above first if the second asset has a fiat balance and the first asset does not', () => {
      const assetA = createMockAsset({
        name: 'Asset A',
        fiatBalance: undefined,
      });
      const assetB = createMockAsset({ name: 'Asset B', fiatBalance: 400 });

      const result = compareFiatBalanceDescending(assetA, assetB);

      expect(result).toBeGreaterThan(0);
    });

    it('compares second value above the first value if both assets have fiat balances and the second value is greater', () => {
      const assetA = createMockAsset({ name: 'Asset A', fiatBalance: 300 });
      const assetB = createMockAsset({ name: 'Asset B', fiatBalance: 400 });

      const result = compareFiatBalanceDescending(assetA, assetB);

      expect(result).toBeGreaterThan(0);
    });
  });

  describe('non-native asset comparison', () => {
    it('returns -1 if the first asset is native and the second asset is not', () => {
      const assetA = createMockAsset({ name: 'Asset A', isNative: true });
      const assetB = createMockAsset({ name: 'Asset B', isNative: false });

      const result = compareFiatBalanceDescending(assetA, assetB);

      expect(result).toBeLessThan(0);
    });

    it('returns 1 if the second asset is native and the first asset is not', () => {
      const assetA = createMockAsset({ name: 'Asset A', isNative: false });
      const assetB = createMockAsset({ name: 'Asset B', isNative: true });

      const result = compareFiatBalanceDescending(assetA, assetB);

      expect(result).toBeGreaterThan(0);
    });

    it('compares name values if neither asset is native', () => {
      const assetA = createMockAsset({ name: 'Asset A', isNative: false });
      const assetB = createMockAsset({ name: 'Asset B', isNative: false });

      const result = compareFiatBalanceDescending(assetA, assetB);

      expect(result).toBeLessThan(0);
    });
  });

  describe('native asset comparison', () => {
    it('compares name values if neither asset is in the defaultNativeAssetOrder', () => {
      const assetA = createMockAsset({
        name: 'Asset A',
        chainId: '0xeeeeeeeeeeeee1',
      });
      const assetB = createMockAsset({
        name: 'Asset B',
        chainId: '0xeeeeeeeeeeeee2',
      });

      const result = compareFiatBalanceDescending(assetA, assetB);

      expect(result).toBeLessThan(0);
    });

    it('compares second value above first if the second asset is in the defaultNativeAssetOrder and the first asset is not', () => {
      const assetA = createMockAsset({
        name: 'Asset A',
        chainId: '0xeeeeeeeeeeeee1',
      });
      const assetB = createMockAsset({
        name: 'Asset B',
        chainId: CHAIN_IDS.BASE,
      });

      const result = compareFiatBalanceDescending(assetA, assetB);

      expect(result).toBeGreaterThan(0);
    });

    it('compares second value above first if both assets are in the defaultNativeAssetOrder and the second value has higher priority', () => {
      const assetA = createMockAsset({
        name: 'Asset A',
        chainId: CHAIN_IDS.ARBITRUM,
      });
      const assetB = createMockAsset({
        name: 'Asset B',
        chainId: CHAIN_IDS.MAINNET,
      });

      const result = compareFiatBalanceDescending(assetA, assetB);

      expect(result).toBeGreaterThan(0);
    });

    it('compares second value above first if both assets are in the defaultNativeAssetOrder and the second value has higher priority (both values have balances of zero)', () => {
      const assetA = createMockAsset({
        name: 'Asset A',
        chainId: CHAIN_IDS.ARBITRUM,
        fiatBalance: 0,
      });
      const assetB = createMockAsset({
        name: 'Asset B',
        chainId: CHAIN_IDS.MAINNET,
        fiatBalance: 0,
      });

      const result = compareFiatBalanceDescending(assetA, assetB);

      expect(result).toBeGreaterThan(0);
    });
  });
});
