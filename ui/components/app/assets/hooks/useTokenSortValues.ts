import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Asset } from '@metamask/assets-controllers';
import {
  getCachedTokenPercentChange,
  getCachedTokenPrice,
} from '#shared/lib/token-price';
import {
  getCurrencyRates,
  getMarketData,
  getUseCurrencyRateCheck,
} from '../../../../selectors';
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
  useCurrencyRateCheck: boolean;
};

/**
 * The number a price or 24h header sorts by. Price is missing when currency
 * rate checks are off, because that column is hidden.
 *
 * @param asset - The asset to read.
 * @param column - The active price or 24h column.
 * @param rates - The cached rate maps.
 * @param rates.marketData - EVM market data keyed by chain id and address.
 * @param rates.currencyRates - Fiat rates keyed by currency symbol.
 * @param rates.conversionRates - Non-EVM rates keyed by asset id.
 * @param rates.useCurrencyRateCheck - Whether price sorting can use cached rates.
 * @returns The sort value, or `undefined` when it is not cached.
 */
export function getTokenSortValue(
  asset: Asset,
  column: TokenSortValueColumn,
  {
    marketData,
    currencyRates,
    conversionRates,
    useCurrencyRateCheck,
  }: SortRateMaps,
): number | undefined {
  if (column === 'price') {
    return useCurrencyRateCheck
      ? getCachedTokenPrice(asset, marketData, currencyRates, conversionRates)
      : undefined;
  }

  return getCachedTokenPercentChange(asset, marketData, conversionRates);
}

/**
 * `getSortValue` for the token table's price or 24h sort. Null for every
 * other column, so the shared token list does not subscribe to rate updates.
 *
 * @param column - The active price or 24h column, or null.
 * @returns `getSortValue` for that column, or null.
 */
export function useTokenSortValues(column: TokenSortValueColumn | null) {
  const marketData = useSelector(getMarketData);
  const currencyRates = useSelector(getCurrencyRates);
  const conversionRates = useSelector(getAssetsRates);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

  return useMemo(() => {
    if (column === null) {
      return null;
    }

    const rates = {
      marketData,
      currencyRates,
      conversionRates,
      useCurrencyRateCheck,
    };
    return (asset: Asset) => getTokenSortValue(asset, column, rates);
  }, [
    column,
    conversionRates,
    currencyRates,
    marketData,
    useCurrencyRateCheck,
  ]);
}
