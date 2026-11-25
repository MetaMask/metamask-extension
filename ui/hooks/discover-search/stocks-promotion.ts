import type { TrendingAsset } from '@metamask/assets-controllers';
import type { DiscoverSearchSection, DiscoverSearchSectionId } from './types';

/**
 * Normalizes a search query or RWA ticker for exact-match comparison.
 * Ignores case, spaces, and a single leading `$`.
 *
 * @param value - The raw query or ticker string.
 * @returns The normalized lowercase string.
 */
export const normalizeStockTicker = (value: string): string =>
  value.trim().replace(/^\$/, '').replace(/\s+/g, '').toLowerCase();

/**
 * Normalizes a search query or RWA asset name for exact-match comparison.
 * Trims, collapses internal whitespace, and lowercases.
 *
 * @param value - The raw query or asset name string.
 * @returns The normalized lowercase string.
 */
export const normalizeStockName = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Strips common issuer suffixes from tokenized stock names (e.g.
 * `"Tesla (Ondo Tokenized)"` -> `"Tesla"`, `"Microsoft xStock"` -> `"Microsoft"`)
 * so exact company-name queries still match issuer-wrapped RWA names.
 *
 * @param name - The tokenized stock display name.
 * @returns The name with trailing issuer suffixes removed.
 */
const stripRwaNameIssuerSuffix = (name: string): string =>
  name
    .trim()
    .replace(/\s*\([^)]*\)\s*$/u, '')
    .replace(/\s+xstock$/iu, '')
    .trim();

/**
 * Strips whitespace and an optional single leading `$` from a query before
 * sending it to search endpoints (so `$TSLA` searches for `TSLA`).
 *
 * @param query - The raw search query.
 * @returns The cleaned query string.
 */
export const stripLeadingDollarQuery = (query?: string): string =>
  query?.trim().replace(/^\$/, '').trim() ?? '';

/**
 * Returns true when `query` exactly matches either `rwaData.ticker` or the
 * RWA asset `name` (full or issuer-stripped) of at least one item in a loaded,
 * non-empty Stocks section.
 *
 * Returns false while Stocks is loading, when it has no results, when the
 * query is empty after normalization, or when the item has no `rwaData`.
 *
 * @param query - The current user search query.
 * @param stocksSection - The Stocks search section state.
 * @returns True if the Stocks section should be promoted above Crypto.
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

/**
 * Moves `'stocks'` to index 0 when `shouldPromote` is true while preserving
 * the relative order of all other sections. Returns the original array
 * reference when no reorder is needed.
 *
 * @param sectionIds - The default ordered section IDs.
 * @param shouldPromote - Whether to promote Stocks to the top.
 * @returns The ordered section IDs.
 */
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
