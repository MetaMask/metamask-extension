import { useCallback, useMemo } from 'react';
import {
  applyLiveTokenFiat,
  readLiveQuotes,
  useMarketStats,
} from '../../../../hooks/assets/market-stats';
import type { TokenWithFiatAmount } from '../types';

/**
 * Applies the streamed quote of one token to its row.
 *
 * Each row reads only its own quote, so a tick re-renders the row it is for
 * and leaves the list alone. A row with no quote is returned as given.
 * The low value partition and the sort stay on the polled fiat, so a row does
 * not change groups on a tick.
 *
 * @param token - The token row, with its polled values.
 * @returns The token with its live price, 24h change and fiat balance.
 */
export function useLiveToken(token: TokenWithFiatAmount): TokenWithFiatAmount {
  const { caipAssetId } = token;
  const selectQuote = useCallback(
    (quotes: Parameters<typeof readLiveQuotes>[0]) =>
      readLiveQuotes(quotes, [caipAssetId]),
    [caipAssetId],
  );
  const [quote] = useMarketStats(selectQuote);

  return useMemo(() => {
    if (quote === undefined) {
      return token;
    }

    return {
      ...applyLiveTokenFiat(token, quote.price),
      livePrice: quote.price,
      ...(quote.pricePercentChange1d === undefined
        ? {}
        : { pricePercentChange1d: quote.pricePercentChange1d }),
    };
  }, [token, quote]);
}
