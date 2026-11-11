import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Asset } from '@metamask/assets-controllers';
import {
  getCachedPercentChange,
  getCachedSpotPrice,
} from '#shared/lib/token-price';
import { getCurrencyRates, getMarketData } from '../../../../selectors';
import { getAssetsRates } from '../../../../selectors/assets';
import type {
  TokenTableHeaderSort,
  TokenTableSort,
} from '../util/sortAssetsWithPriority';

/**
 * The table-header sort, including the price or 24h reader when that column
 * is selected. Token and balance sorts return the header state unchanged, so
 * a rate update does not rebuild the list.
 *
 * @param headerSort - The column and direction selected in the table header.
 * @returns The sort passed to the token list, or null when the header is using the saved preference.
 */
export function useTokenSortOverride(
  headerSort: TokenTableHeaderSort | null,
): TokenTableSort | null {
  const marketData = useSelector(getMarketData);
  const currencyRates = useSelector(getCurrencyRates);
  const conversionRates = useSelector(getAssetsRates);

  return useMemo(() => {
    if (
      headerSort === null ||
      headerSort.column === 'token' ||
      headerSort.column === 'balance'
    ) {
      return headerSort;
    }

    const { column, reversed } = headerSort;

    return {
      column,
      reversed,
      getValue: (asset: Asset) => {
        const isNative = Boolean(asset.isNative);
        const address = 'address' in asset ? asset.address : asset.assetId;

        if (column === 'price') {
          return getCachedSpotPrice({
            isNative,
            symbol: asset.symbol,
            chainId: asset.chainId,
            address,
            marketData,
            currencyRates,
            conversionRates,
          });
        }

        return getCachedPercentChange({
          isNative,
          chainId: asset.chainId,
          address,
          marketData,
          conversionRates,
        });
      },
    };
  }, [conversionRates, currencyRates, headerSort, marketData]);
}
