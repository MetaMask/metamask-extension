import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { LivePriceMap } from '@metamask/core-backend';

import {
  liveGroupFiatAdjustments,
  useMarketStats,
} from '#ui/hooks/assets/market-stats';
import { getAssetsByAccountGroupForLiveTotals } from '#ui/selectors/assets';
import { assetToCaipId } from '#shared/lib/asset-utils';

/**
 * How much to add to each account group's polled fiat total so the sidebar
 * matches the header, which already replaces polled prices with the stream.
 *
 * The selected group uses the same asset rows as the header total. Other
 * groups use their own rows, so an account you are not viewing still moves
 * when one of its assets ticks.
 *
 * @returns Deltas keyed by account group id. Missing keys stay on the polled total.
 */
export function useLiveAccountGroupFiatAdjustments(): ReadonlyMap<
  string,
  number
> {
  const assetsByGroupForLiveTotals = useSelector(
    getAssetsByAccountGroupForLiveTotals,
  );

  const selectAdjustments = useCallback(
    (quotes: LivePriceMap) => {
      return liveGroupFiatAdjustments(
        assetsByGroupForLiveTotals,
        quotes,
        assetToCaipId,
      );
    },
    [assetsByGroupForLiveTotals],
  );

  return useMarketStats(selectAdjustments);
}
