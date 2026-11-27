import type { TrendingAsset } from '@metamask/assets-controllers';
import type { DiscoverSearchSection, DiscoverSearchSectionId } from './types';

/** Normalize an RWA ticker or query for exact matching. */
export const normalizeStockTicker = (value: string): string =>
  value.trim().replace(/^\$/u, '').replace(/\s+/gu, '').toLowerCase();

/** Normalize an RWA asset name or query for exact matching. */
export const normalizeStockName = (value: string): string =>
  value.trim().replace(/\s+/gu, ' ').toLowerCase();

/** Strip common issuer suffixes from tokenized stock names. */
const stripRwaNameIssuerSuffix = (name: string): string =>
  name
    .trim()
    .replace(/\s*\([^)]*\)\s*$/u, '')
    .replace(/\s+xstock$/iu, '')
    .trim();

/** Strip whitespace and an optional leading `$` from a search query. */
export const stripLeadingDollarQuery = (query?: string): string =>
  query?.trim().replace(/^\$/u, '').trim() ?? '';

/**
 * Return true when a loaded Stocks result exactly matches the query by ticker
 * or full/issuer-stripped name.
 */
export const shouldPromoteStocksSection = (
  query: string,
  stocksSection:
    | Pick<DiscoverSearchSection<TrendingAsset>, 'items' | 'isLoading'>
    | undefined,
): boolean => {
  if (
    !stocksSection ||
    stocksSection.isLoading ||
    stocksSection.items.length === 0
  ) {
    return false;
  }

  const normalizedTickerQuery = normalizeStockTicker(query);
  const normalizedNameQuery = normalizeStockName(query);
  if (!normalizedTickerQuery && !normalizedNameQuery) {
    return false;
  }

  return stocksSection.items.some((item) => {
    const asset = item as Partial<TrendingAsset> | null | undefined;
    if (!asset?.rwaData) {
      return false;
    }

    const { ticker } = asset.rwaData;
    if (
      normalizedTickerQuery &&
      typeof ticker === 'string' &&
      normalizeStockTicker(ticker) === normalizedTickerQuery
    ) {
      return true;
    }

    const { name } = asset;
    if (normalizedNameQuery && typeof name === 'string') {
      if (normalizeStockName(name) === normalizedNameQuery) {
        return true;
      }
      const strippedName = normalizeStockName(stripRwaNameIssuerSuffix(name));
      if (strippedName && strippedName === normalizedNameQuery) {
        return true;
      }
    }

    return false;
  });
};

/** Move Stocks to the front while preserving the order of other sections. */
export const orderDiscoverSearchSections = (
  sectionIds: readonly DiscoverSearchSectionId[],
  shouldPromote: boolean,
): readonly DiscoverSearchSectionId[] => {
  if (!shouldPromote) {
    return sectionIds;
  }

  const stocksIndex = sectionIds.indexOf('stocks');
  if (stocksIndex <= 0) {
    return sectionIds;
  }

  return [
    sectionIds[stocksIndex],
    ...sectionIds.slice(0, stocksIndex),
    ...sectionIds.slice(stocksIndex + 1),
  ];
};
