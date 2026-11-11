import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Asset } from '@metamask/assets-controllers';
import {
  getCachedTokenPercentChange,
  getCachedTokenPrice,
} from '#shared/lib/token-price';
import { getCurrencyRates, getMarketData } from '../../../../selectors';
import { getAssetsRates } from '../../../../selectors/assets';
import type { TokenTableSort } from '../util/sortAssetsWithPriority';

export type TokenSortValueColumn = Extract<
  TokenTableSort['column'],
  'price' | 'change'
>;

type SortRateMaps = {
  marketData: Parameters<typeof getCachedTokenPrice>[1];
  currencyRates: Parameters<typeof getCachedTokenPrice>[2];
  conversionRates: Parameters<typeof getCachedTokenPrice>[3];
};

/**
 * The number a price or 24h header sorts by.
 *
 * @param asset - The asset to read.
 * @param column - The active price or 24h column.
 * @param rates - The cached rate maps.
 * @param rates.marketData - EVM market data keyed by chain id and address.
 * @param rates.currencyRates - Fiat rates keyed by currency symbol.
 * @param rates.conversionRates - Non-EVM rates keyed by asset id.
 * @returns The sort value, or `undefined` when it is not cached.
 */
export function getTokenSortValue(
  asset: Asset,
  column: TokenSortValueColumn,
  { marketData, currencyRates, conversionRates }: SortRateMaps,
): number | undefined {
  if (column === 'price') {
    return getCachedTokenPrice(
      asset,
      marketData,
      currencyRates,
      conversionRates,
    );
  }

  return getCachedTokenPercentChange(asset, marketData, conversionRates);
}

/**
 * `getValue` for a price or 24h table sort. Null for every other column, so
 * the shared token list does not rebuild when rates change.
 *
 * @param column - The active price or 24h column, or null.
 * @returns The value reader for that column, or null.
 */
export function useTokenSortValues(column: TokenSortValueColumn | null) {
  const marketData = useSelector(getMarketData);
  const currencyRates = useSelector(getCurrencyRates);
  const conversionRates = useSelector(getAssetsRates);

  return useMemo(() => {
    if (column === null) {
      return null;
    }

    const rates = {
      marketData,
      currencyRates,
      conversionRates,
    };
    return (asset: Asset) => getTokenSortValue(asset, column, rates);
  }, [column, conversionRates, currencyRates, marketData]);
}
