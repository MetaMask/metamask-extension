import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  liveGroupFiatAdjustments,
  useLiveAssetPrices,
} from '../../../hooks/assets/market-stats-live-prices';
import {
  getAssetsByAllAccountGroups,
  getAssetsBySelectedAccountGroup,
} from '../../../selectors/assets';
import { getSelectedAccountGroup } from '../../../selectors/multichain-accounts/account-tree';
import { toCaipAssetId } from '../../app/assets/util/to-caip-asset-id';

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
  const livePrices = useLiveAssetPrices();
  const assetsByGroup = useSelector(getAssetsByAllAccountGroups);
  const selectedGroupId = useSelector(getSelectedAccountGroup);
  const selectedGroupAssets = useSelector(getAssetsBySelectedAccountGroup);

  return useMemo(() => {
    const assetsByGroupForLiveTotals = selectedGroupId
      ? { ...assetsByGroup, [selectedGroupId]: selectedGroupAssets }
      : assetsByGroup;

    return liveGroupFiatAdjustments(
      assetsByGroupForLiveTotals,
      livePrices,
      toCaipAssetId,
    );
  }, [assetsByGroup, livePrices, selectedGroupAssets, selectedGroupId]);
}
