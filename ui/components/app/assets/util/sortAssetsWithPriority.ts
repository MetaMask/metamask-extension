import type { Asset } from '@metamask/assets-controllers';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import type { CaipChainId, Hex } from '@metamask/utils';
import { BtcScope, SolScope, TrxScope } from '@metamask/keyring-api';
import { sortAssets, type SortCriteria } from './sort';

// These are the only two options for sorting assets
// {"key": "name", "order": "asc", "sortCallback": "alphaNumeric"}
// {"key": "tokenFiatAmount", "order": "dsc", "sortCallback": "stringNumeric"}
export function sortAssetsWithPriority(
  array: Asset[],
  criteria: SortCriteria,
): Asset[] {
  if (criteria.key === 'name' || criteria.key === 'title') {
    return sortAssets(array, {
      key: 'name',
      order: 'asc',
      sortCallback: 'alphaNumeric',
    });
  }

  return [...array].sort(compareFiatBalanceDescending);
}

export type TokenTableSort = {
  column: 'token' | 'price' | 'change' | 'balance';
  reversed: boolean;
};

export type TokenSortValues = {
  getPrice?: (asset: Asset) => number | undefined;
  getPercentChange?: (asset: Asset) => number | undefined;
};

/**
 * Sorts tokens for the table header. Without an override, this is the saved
 * preference. The override is not written back to that preference.
 *
 * @param array - The assets to sort.
 * @param criteria - The saved token sort preference.
 * @param override - A table-header sort, when the user has clicked a column.
 * @param values - Spot price and 24h change for the price and change columns.
 * @returns The assets in the requested order.
 */
export function sortTokenAssets(
  array: Asset[],
  criteria: SortCriteria,
  override?: TokenTableSort | null,
  values: TokenSortValues = {},
): Asset[] {
  if (!override) {
    return sortAssetsWithPriority(array, criteria);
  }

  if (override.column === 'token') {
    return sortAssets(array, {
      key: 'name',
      order: override.reversed ? 'dsc' : 'asc',
      sortCallback: 'alphaNumeric',
    });
  }

  if (override.column === 'price' || override.column === 'change') {
    const getValue =
      override.column === 'price' ? values.getPrice : values.getPercentChange;
    return [...array].sort(
      compareAssetsByNumber(getValue ?? (() => undefined), override.reversed),
    );
  }

  return [...array].sort((a, b) => compareFiatBalance(a, b, override.reversed));
}

/**
 * Orders assets by a number. Missing values stay last. Equal values are
 * ordered by name.
 *
 * @param getValue - The number to sort by.
 * @param reversed - When true, the lowest value comes first.
 * @returns A comparator for `Array.prototype.sort`.
 */
function compareAssetsByNumber(
  getValue: (asset: Asset) => number | undefined,
  reversed: boolean,
) {
  return (a: Asset, b: Asset) => {
    const comparison = compareOptionalNumbers(
      getValue(a),
      getValue(b),
      reversed,
    );
    if (comparison !== 0) {
      return comparison;
    }
    return a.name.localeCompare(b.name);
  };
}

/**
 * Compares two numbers. A missing number sorts after a known number in either
 * direction.
 *
 * @param valueA - The first value.
 * @param valueB - The second value.
 * @param reversed - When true, the lower value comes first.
 * @returns A negative number when the first value comes first.
 */
function compareOptionalNumbers(
  valueA: number | undefined,
  valueB: number | undefined,
  reversed: boolean,
) {
  if (valueA === undefined || !Number.isFinite(valueA)) {
    return valueB === undefined || !Number.isFinite(valueB) ? 0 : 1;
  }
  if (valueB === undefined || !Number.isFinite(valueB)) {
    return -1;
  }
  if (valueA === valueB) {
    return 0;
  }

  const lowToHigh = valueA - valueB;
  return reversed ? lowToHigh : -lowToHigh;
}

// Higher priority assets are last in the array to facilitate sorting
const defaultNativeAssetOrder: (Hex | CaipChainId)[] = [
  CHAIN_IDS.POLYGON,
  CHAIN_IDS.OPTIMISM,
  CHAIN_IDS.BSC,
  CHAIN_IDS.ARBITRUM,
  CHAIN_IDS.BASE,
  TrxScope.Mainnet,
  BtcScope.Mainnet,
  SolScope.Mainnet,
  CHAIN_IDS.MAINNET,
];

/**
 * Orders assets that have the same fiat balance.
 * Native assets come before tokens. Two native assets follow
 * `defaultNativeAssetOrder`. Everything else is ordered by name.
 *
 * @param a - The first asset to compare.
 * @param b - The second asset to compare.
 * @returns A negative number if the first asset should appear before the second, a positive number if the first asset should appear after the second, or 0 if they are equal.
 */
function compareAssetsWithEqualFiatBalance(a: Asset, b: Asset) {
  if (a.isNative && !b.isNative) {
    return -1;
  }

  if (b.isNative && !a.isNative) {
    return 1;
  }

  if (!a.isNative && !b.isNative) {
    return a.name.localeCompare(b.name);
  }

  const nativeAssetOrderA = defaultNativeAssetOrder.indexOf(a.chainId);
  const nativeAssetOrderB = defaultNativeAssetOrder.indexOf(b.chainId);

  const nativeAssetOrderComparison = nativeAssetOrderB - nativeAssetOrderA;

  if (nativeAssetOrderComparison) {
    return nativeAssetOrderComparison;
  }

  // If neither asset is in the defaultNativeAssetOrder, compare by name
  return a.name.localeCompare(b.name);
}

/**
 * Compares assets by fiat balance. Equal balances use the native-asset and
 * name ordering from {@link compareAssetsWithEqualFiatBalance}.
 *
 * @param a - The first asset to compare.
 * @param b - The second asset to compare.
 * @param lowToHigh - When true, the lower balance comes first.
 * @returns A negative number if the first asset should appear before the second, a positive number if the first asset should appear after the second, or 0 if they are equal.
 */
function compareFiatBalance(a: Asset, b: Asset, lowToHigh: boolean) {
  const fiatBalanceComparison = lowToHigh
    ? (a.fiat?.balance ?? 0) - (b.fiat?.balance ?? 0)
    : (b.fiat?.balance ?? 0) - (a.fiat?.balance ?? 0);

  if (fiatBalanceComparison) {
    return fiatBalanceComparison;
  }

  return compareAssetsWithEqualFiatBalance(a, b);
}

/**
 * Compares assets by fiat balance, highest first.
 *
 * @param a - The first asset to compare.
 * @param b - The second asset to compare.
 * @returns A negative number if the first asset should appear before the second, a positive number if the first asset should appear after the second, or 0 if they are equal.
 */
export function compareFiatBalanceDescending(a: Asset, b: Asset) {
  return compareFiatBalance(a, b, false);
}
