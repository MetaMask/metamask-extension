import { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';
import { hasAnyEnabledAsset } from './hasAnyEnabledAsset';

export const hasAtLeastOneQuoteAvailable = (
  sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'],
  quotes?: BatchSellQuotesResults['quotes'],
) => {
  return (
    hasAnyEnabledAsset(sendAssetsConfig) &&
    Object.values(quotes ?? {}).some((quote) => quote.hasQuote)
  );
};
