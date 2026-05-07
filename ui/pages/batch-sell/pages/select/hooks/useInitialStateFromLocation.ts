import { CaipChainId } from '@metamask/utils';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { BatchSellNavigationState } from '../../../../../hooks/batch-sell/useBatchSellNavigation';

export const useInitialStateFromLocation = (
  availableNetworkChainIds: CaipChainId[],
  getAvailableAssetIds: (chainId: CaipChainId | null) => string[],
): { networkChainId: CaipChainId | null; assetsId: string[] } => {
  const { state } = useLocation();
  const locationState = (state ?? {}) as BatchSellNavigationState;

  return useMemo(() => {
    const firstChainId = availableNetworkChainIds[0] ?? null;

    const restoredChainId =
      locationState.selectedNetworkChainId &&
      availableNetworkChainIds.includes(locationState.selectedNetworkChainId)
        ? locationState.selectedNetworkChainId
        : null;

    const networkChainId = restoredChainId ?? firstChainId;
    const networkWasRestored = restoredChainId !== null;

    if (!networkWasRestored || !locationState.selectedAssetsId?.length) {
      return { networkChainId, assetsId: [] };
    }

    const availableAssetIds = getAvailableAssetIds(networkChainId);
    const assetsId = locationState.selectedAssetsId.filter((id) =>
      availableAssetIds.includes(id),
    );

    return { networkChainId, assetsId };
    // Only run on mount, available lists are stable at this point
    // eslint-disable-next-line
  }, []);
};
