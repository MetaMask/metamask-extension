import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectNonEvmActivityItems } from '../../selectors/activity';
import { activityMatchesAssetId, type ActivityListFilter } from './helpers';

export function useNonEvmTransactions(filters: ActivityListFilter) {
  const nonEvmItems = useSelector(selectNonEvmActivityItems);
  const assetId = 'assetId' in filters ? filters.assetId : undefined;
  const networks = 'networks' in filters ? filters.networks : undefined;

  return useMemo(() => {
    if (assetId) {
      return nonEvmItems.filter((item) =>
        activityMatchesAssetId(item, assetId),
      );
    }

    if (!networks?.length) {
      return [];
    }

    const selectedNetworks = new Set(networks);
    return nonEvmItems.filter((item) => selectedNetworks.has(item.chainId));
  }, [assetId, networks, nonEvmItems]);
}
