import React, { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CaipChainId } from '@metamask/utils';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import {
  getAvailableBatchSellSwapAssetsForNetwork,
  getAvailableBatchSellNetworks,
  getBatchSellDestStablecoinsForNetwork,
} from '../../../../ducks/batch-sell/selectors';
import type { BridgeAppState } from '../../../../ducks/bridge/selectors';
import { BatchSellAsset } from '../../../../ducks/batch-sell/types';
import { useSortBatchSellAssetsByBalance } from '../../../../hooks/batch-sell/useSortBatchSellAssetsByBalance';
import { useBatchSellNavigation } from '../../../../hooks/batch-sell/useBatchSellNavigation';
import { useBatchSellSelection } from '../../providers/batch-sell-selection-provider';
import { MIN_SELECTED_ALLOWED_TOKENS } from '../../../../constants/batch-sell';
import { transitionForward } from '../../../../components/ui/transition';
import { endTrace, TraceName } from '../../../../../shared/lib/trace';
import { useBatchSellHighRateAlertModal } from '../../hooks/useBatchSellHighRateAlertModal';
import { SortingToolbar } from './components/sorting-toolbar';
import { NetworkToolbar } from './components/network-toolbar';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { AssetList } from './components/asset-list';
import { BatchSellEmptySelectTokens } from './components/batch-sell-empty-select-tokens';

export const BatchSellSelectPage = () => {
  const { openHighAlertModal } = useBatchSellHighRateAlertModal();
  const { navigateToBatchSellConfirmPage } = useBatchSellNavigation();
  const {
    selectedNetworkChainId,
    selectedAssetsId,
    assetsOrderByBalance,
    hasUserInteracted,
    setSelectedNetworkChainId,
    setSelectedAssetsId,
    setAssetsOrderByBalance,
    setHasUserInteracted,
  } = useBatchSellSelection();

  const availableBatchSellNetworksList = useSelector(
    getAvailableBatchSellNetworks,
  );

  const availableNetworkChainIds = useMemo(
    () => availableBatchSellNetworksList.map((n) => n.chainId),
    [availableBatchSellNetworksList],
  );

  useEffect(() => {
    endTrace({ name: TraceName.BatchSellModal });
  }, []);

  useLayoutEffect(() => {
    // The available networks list is sorted by balance descending but resolves
    // asynchronously, so its top entry can change across renders as fiat data
    // streams in. Until the user makes an explicit selection, keep the default
    // pinned to the highest-balance network (the first entry) rather than
    // locking in whichever network happened to load first.
    if (hasUserInteracted) {
      return;
    }
    const topNetworkChainId = availableNetworkChainIds[0];
    if (topNetworkChainId && topNetworkChainId !== selectedNetworkChainId) {
      setSelectedNetworkChainId(topNetworkChainId);
    }
  }, [
    availableNetworkChainIds,
    hasUserInteracted,
    selectedNetworkChainId,
    setSelectedNetworkChainId,
  ]);

  const availableBatchSellAssetsForNetworkList = useSelector(
    (state: BridgeAppState) =>
      getAvailableBatchSellSwapAssetsForNetwork(state, selectedNetworkChainId),
  );

  const batchSellDestStablecoins = useSelector((state: BridgeAppState) =>
    getBatchSellDestStablecoinsForNetwork(
      state,
      selectedNetworkChainId ?? undefined,
    ),
  );

  const orderedAvailableBatchSellAssetsForNetworkList =
    useSortBatchSellAssetsByBalance(
      availableBatchSellAssetsForNetworkList,
      assetsOrderByBalance,
    );

  const onNetworkSelect = useCallback(
    (chainId: CaipChainId) => {
      setHasUserInteracted(true);
      setSelectedAssetsId([]);
      setSelectedNetworkChainId(chainId);
    },
    [setHasUserInteracted, setSelectedAssetsId, setSelectedNetworkChainId],
  );

  const onSelectAsset = useCallback(
    (asset: BatchSellAsset) => {
      setHasUserInteracted(true);
      setSelectedAssetsId((assets) =>
        assets.includes(asset.assetId) ? assets : [...assets, asset.assetId],
      );
    },
    [setHasUserInteracted, setSelectedAssetsId],
  );

  const onDeselectAsset = useCallback(
    (asset: BatchSellAsset) => {
      setSelectedAssetsId((assets) =>
        assets.filter((_assetId) => _assetId !== asset.assetId),
      );
    },
    [setSelectedAssetsId],
  );

  const onSubmit = useCallback(() => {
    if (selectedAssetsId.length < MIN_SELECTED_ALLOWED_TOKENS) {
      const selectedAsset = availableBatchSellAssetsForNetworkList.find(
        (asset) => asset.assetId === selectedAssetsId[0],
      );
      const destTokenAssetId = batchSellDestStablecoins[0];

      openHighAlertModal(selectedAsset, destTokenAssetId);
      return;
    }

    transitionForward(navigateToBatchSellConfirmPage);
  }, [
    selectedAssetsId,
    navigateToBatchSellConfirmPage,
    availableBatchSellAssetsForNetworkList,
    batchSellDestStablecoins,
    openHighAlertModal,
  ]);

  if (!selectedNetworkChainId) {
    return <BatchSellEmptySelectTokens />;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full"
      data-testid="batch-sell-select-page"
    >
      <Header />
      <NetworkToolbar
        networks={availableBatchSellNetworksList}
        selectedNetworkChainId={selectedNetworkChainId}
        onClick={onNetworkSelect}
      />
      <SortingToolbar
        balance={{
          order: assetsOrderByBalance,
          onClick: setAssetsOrderByBalance,
        }}
      />
      <AssetList
        selectedAssetsId={selectedAssetsId}
        assets={orderedAvailableBatchSellAssetsForNetworkList}
        onSelect={onSelectAsset}
        onDeselect={onDeselectAsset}
      />
      <Footer selectedAssetsId={selectedAssetsId} onSubmit={onSubmit} />
    </Box>
  );
};
