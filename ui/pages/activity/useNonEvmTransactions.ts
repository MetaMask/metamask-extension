import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectNonEvmActivityItems } from '../../selectors/activity';
import { selectRampsSettlementHashes } from '../../selectors/rampsController';
import { activityMatchesAssetId, type ActivityListFilter } from './helpers';

export function useNonEvmTransactions(filters: ActivityListFilter) {
  const nonEvmItems = useSelector(selectNonEvmActivityItems);
  const rampSettlementHashes = useSelector(selectRampsSettlementHashes);
  const assetId = 'assetId' in filters ? filters.assetId : undefined;
  const networks = 'networks' in filters ? filters.networks : undefined;

  return useMemo(() => {
    let items = nonEvmItems;

    if (assetId) {
      items = items.filter((item) => activityMatchesAssetId(item, assetId));
    } else if (networks?.length) {
      const selectedNetworks = new Set(networks);
      items = items.filter((item) => selectedNetworks.has(item.chainId));
    } else {
      return [];
    }

    if (rampSettlementHashes.size === 0) {
      return items;
    }

    return items.filter((item) => {
      const hash = item.hash?.toLowerCase();
      return !hash || !rampSettlementHashes.has(hash);
    });
  }, [assetId, networks, nonEvmItems, rampSettlementHashes]);
}
