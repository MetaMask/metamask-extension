import React, { useCallback, useMemo, useState } from 'react';
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
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useBatchSellInfoModal } from '../../hooks/useBatchSellInfoModal';
import { useBatchSellNavigation } from '../../../../hooks/batch-sell/useBatchSellNavigation';
import { MIN_SELECTED_ALLOWED_TOKENS } from '../../../../constants/batch-sell';
import { transitionForward } from '../../../../components/ui/transition';
import useBridging from '../../../../hooks/bridge/useBridging';
import { MetaMetricsSwapsEventSource } from '../../../../../shared/constants/metametrics';
import { SortingToolbar } from './components/sorting-toolbar';
import { NetworkToolbar } from './components/network-toolbar';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { AssetList } from './components/asset-list';
import { BatchSellEmptySelectTokens } from './components/batch-sell-empty-select-tokens';
import { useInitialStateFromLocation } from './hooks/useInitialStateFromLocation';
import { getSourceTokenAddress } from './utils';

export const BatchSellSelectPage = () => {
  const t = useI18nContext();
  const { openBridgeExperience } = useBridging();
  const { openModal, closeModal } = useBatchSellInfoModal();
  const { navigateToBatchSellConfirmPage } = useBatchSellNavigation();

  const [assetsOrderByBalance, setAssetsOrderByBalance] = useState<
    'asc' | 'desc'
  >('desc');

  const availableBatchSellNetworksList = useSelector(
    getAvailableBatchSellNetworks,
  );

  const availableNetworkChainIds = useMemo(
    () => availableBatchSellNetworksList.map((n) => n.chainId),
    [availableBatchSellNetworksList],
  );

  // Need a stable getter for assets at init time (before selectedNetworkChainId state exists)
  // We use a selector directly for each candidate chainId
  const allAssetsByNetwork = useSelector((state: BridgeAppState) => {
    const result: Record<string, string[]> = {};
    for (const chainId of availableNetworkChainIds) {
      result[chainId] = getAvailableBatchSellSwapAssetsForNetwork(
        state,
        chainId,
      ).map((a) => a.assetId);
    }
    return result;
  });

  const getAvailableAssetIds = useCallback(
    (chainId: CaipChainId | null) =>
      chainId ? (allAssetsByNetwork[chainId] ?? []) : [],
    [allAssetsByNetwork],
  );

  const { networkChainId: initialNetworkChainId, assetsId: initialAssetsId } =
    useInitialStateFromLocation(availableNetworkChainIds, getAvailableAssetIds);

  const [selectedNetworkChainId, setSelectedNetworkChainId] =
    useState<CaipChainId | null>(initialNetworkChainId);

  const [selectedAssetsId, setSelectedAssetsId] =
    useState<string[]>(initialAssetsId);

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

  const onNetworkSelect = useCallback((chainId: CaipChainId) => {
    setSelectedAssetsId([]);
    setSelectedNetworkChainId(chainId);
  }, []);

  const onSelectAsset = useCallback(
    (asset: BatchSellAsset) =>
      setSelectedAssetsId((assets) =>
        assets.includes(asset.assetId) ? assets : [...assets, asset.assetId],
      ),
    [],
  );

  const onDeselectAsset = useCallback((asset: BatchSellAsset) => {
    setSelectedAssetsId((assets) =>
      assets.filter((_assetId) => _assetId !== asset.assetId),
    );
  }, []);

  const navigateToBridgePageAndPreselect = useCallback(() => {
    closeModal();
    const selectedAsset = availableBatchSellAssetsForNetworkList.find(
      (asset) => asset.assetId === selectedAssetsId[0],
    );
    const sourceToken = selectedAsset
      ? {
          symbol: selectedAsset.symbol,
          address: getSourceTokenAddress(selectedAsset),
          name: selectedAsset.name,
          chainId: selectedAsset.chainId,
        }
      : undefined;

    const destTokenAssetId = batchSellDestStablecoins[0];

    transitionForward(() =>
      openBridgeExperience(
        MetaMetricsSwapsEventSource.MainView,
        sourceToken,
        destTokenAssetId,
      ),
    );
  }, [
    availableBatchSellAssetsForNetworkList,
    batchSellDestStablecoins,
    closeModal,
    openBridgeExperience,
    selectedAssetsId,
  ]);

  const onSubmit = useCallback(() => {
    if (selectedAssetsId.length < MIN_SELECTED_ALLOWED_TOKENS) {
      openModal({
        titleProps: {
          children: t('batchSellHighRateAlert'),
        },
        descriptionProps: {
          children: t('batchSellHightRateAlertModalDescription'),
        },
        ctaProps: {
          text: t('yesSwap'),
          onClick: navigateToBridgePageAndPreselect,
        },
      });
      return;
    }

    transitionForward(() =>
      navigateToBatchSellConfirmPage({
        selectedNetworkChainId,
        selectedAssetsId,
      }),
    );
  }, [
    selectedAssetsId,
    selectedNetworkChainId,
    openModal,
    navigateToBatchSellConfirmPage,
    navigateToBridgePageAndPreselect,
    t,
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
