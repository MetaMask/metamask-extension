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
  const numericSort = (
    column: 'price' | 'change',
    reversed: boolean,
    getValue: (asset: Asset) => number | undefined,
  ) => ({ column, reversed, getValue });

  it('sorts names from Z to A when the token column is reversed', () => {
    const sortedNames = sortTokenAssets(assets, savedBalanceSort, {
      column: 'token',
      reversed: true,
    }).map((asset) => asset.name);

    expect(sortedNames).toStrictEqual(['Asset Z', 'Asset B', 'Asset A']);
  });

  it('sorts the lower fiat balance first when the balance column is reversed', () => {
    const sortedNames = sortTokenAssets(assets, savedBalanceSort, {
      column: 'balance',
      reversed: true,
    }).map((asset) => asset.name);

    expect(sortedNames).toStrictEqual(['Asset Z', 'Asset B', 'Asset A']);
  });

  it('keeps a native asset ahead of a token when reversed balances are equal', () => {
    const sortedNames = sortTokenAssets(
      [
        createMockAsset({ name: 'Token', fiatBalance: 10, isNative: false }),
        createMockAsset({ name: 'Native', fiatBalance: 10, isNative: true }),
      ],
      savedBalanceSort,
      { column: 'balance', reversed: true },
    ).map((asset) => asset.name);

    expect(sortedNames).toStrictEqual(['Native', 'Token']);
  });

  it('sorts alphabetically when the token column is selected', () => {
    const sortedNames = sortTokenAssets(assets, savedBalanceSort, {
      column: 'token',
      reversed: false,
    }).map((asset) => asset.name);

    expect(sortedNames).toStrictEqual(['Asset A', 'Asset B', 'Asset Z']);
  });

  it('sorts the highest price first and leaves missing prices last', () => {
    const prices: Record<string, number | undefined> = {
      'Asset A': 2,
      'Asset B': 10,
    };

    const sortedNames = sortTokenAssets(
      assets,
      savedBalanceSort,
      numericSort('price', false, (asset) => prices[asset.name]),
    ).map((asset) => asset.name);

    expect(sortedNames).toStrictEqual(['Asset B', 'Asset A', 'Asset Z']);
  });

  it('sorts the lowest price first when the price column is reversed', () => {
    const prices: Record<string, number | undefined> = {
      'Asset A': 2,
      'Asset B': 10,
    };

    const sortedNames = sortTokenAssets(
      assets,
      savedBalanceSort,
      numericSort('price', true, (asset) => prices[asset.name]),
    ).map((asset) => asset.name);

    expect(sortedNames).toStrictEqual(['Asset A', 'Asset B', 'Asset Z']);
  });

  it('sorts non-finite prices last', () => {
    const prices: Record<string, number> = {
      'Asset A': Number.NaN,
      'Asset B': Number.POSITIVE_INFINITY,
      'Asset Z': 1,
    };

    const highestFirst = sortTokenAssets(
      assets,
      savedBalanceSort,
      numericSort('price', false, (asset) => prices[asset.name]),
    ).map((asset) => asset.name);
    const lowestFirst = sortTokenAssets(
      assets,
      savedBalanceSort,
      numericSort('price', true, (asset) => prices[asset.name]),
    ).map((asset) => asset.name);

    expect(highestFirst).toStrictEqual(['Asset Z', 'Asset A', 'Asset B']);
    expect(lowestFirst).toStrictEqual(['Asset Z', 'Asset A', 'Asset B']);
  });

  it('orders assets by name when every price is missing', () => {
    const sortedNames = sortTokenAssets(
      assets,
      savedBalanceSort,
      numericSort('price', false, () => undefined),
    ).map((asset) => asset.name);

    expect(sortedNames).toStrictEqual(['Asset A', 'Asset B', 'Asset Z']);
  });

  it('orders equal prices by name', () => {
    const prices: Record<string, number> = {
      'Asset A': 5,
      'Asset B': 5,
      'Asset Z': 5,
    };

    const sortedNames = sortTokenAssets(
      assets,
      savedBalanceSort,
      numericSort('price', true, (asset) => prices[asset.name]),
    ).map((asset) => asset.name);

    expect(sortedNames).toStrictEqual(['Asset A', 'Asset B', 'Asset Z']);
  });

  it('sorts the largest 24h gain first and leaves missing changes last', () => {
    const changes: Record<string, number | undefined> = {
      'Asset A': -2,
      'Asset B': 4,
    };

    const sortedNames = sortTokenAssets(
      assets,
      savedBalanceSort,
      numericSort('change', false, (asset) => changes[asset.name]),
    ).map((asset) => asset.name);

    expect(sortedNames).toStrictEqual(['Asset B', 'Asset A', 'Asset Z']);
  });

  it('sorts non-finite 24h changes last', () => {
    const changes: Record<string, number> = {
      'Asset A': Number.NaN,
      'Asset B': Number.NEGATIVE_INFINITY,
      'Asset Z': -1,
    };

    const sortedNames = sortTokenAssets(
      assets,
      savedBalanceSort,
      numericSort('change', true, (asset) => changes[asset.name]),
    ).map((asset) => asset.name);

    expect(sortedNames).toStrictEqual(['Asset Z', 'Asset A', 'Asset B']);
  });

  it('sorts the largest 24h loss first when the change column is reversed', () => {
    const changes: Record<string, number | undefined> = {
      'Asset A': -2,
      'Asset B': 4,
    };

    const sortedNames = sortTokenAssets(
      assets,
      savedBalanceSort,
      numericSort('change', true, (asset) => changes[asset.name]),
    ).map((asset) => asset.name);

    expect(sortedNames).toStrictEqual(['Asset A', 'Asset B', 'Asset Z']);
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
