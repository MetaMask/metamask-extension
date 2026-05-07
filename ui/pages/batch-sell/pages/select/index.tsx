import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { CaipChainId } from '@metamask/utils';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import {
  getAvailableBatchSellAssetsForNetworkSelector,
  getAvailableBatchSellNetworksSelector,
} from '../../../../ducks/batch-sell/selectors';
import { BatchSellAsset } from '../../../../ducks/batch-sell/types';
import { useSortBatchSellAssetsByBalance } from '../../../../hooks/batch-sell/useSortBatchSellAssetsByBalance';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useBatchSellModal } from '../../hooks/useBatchSellModal';
import { useBatchSellNavigation } from '../../../../hooks/batch-sell/useBatchSellNavigation';
import { MIN_SELECTED_ALLOWED_TOKENS } from '../../../../constants/batch-sell';
import { transitionForward } from '../../../../components/ui/transition';
import useBridging from '../../../../hooks/bridge/useBridging';
import { MetaMetricsSwapsEventSource } from '../../../../../shared/constants/metametrics';
import { SortingToolbar } from './components/SortingToolbar';
import { NetworkToolbar } from './components/NetworkToolbar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AssetList } from './components/AssetList';
import { BatchSellEmptySelectTokens } from './components/BatchSellEmptySelectTokens';
import { useInitialStateFromLocation } from './hooks/useInitialStateFromLocation';

export const BatchSellSelectPage = () => {
  const t = useI18nContext();
  const { openBridgeExperience } = useBridging();
  const { openModal, closeModal } = useBatchSellModal();
  const { navigateToBatchSellConfirmPage } = useBatchSellNavigation();

  const [assetsOrderByBalance, setAssetsOrderByBalance] = useState<
    'asc' | 'desc'
  >('desc');

  const availableBatchSellNetworksList = useSelector(
    getAvailableBatchSellNetworksSelector,
  );

  const availableNetworkChainIds = useMemo(
    () => availableBatchSellNetworksList.map((n) => n.chainId),
    [availableBatchSellNetworksList],
  );

  // Need a stable getter for assets at init time (before selectedNetworkChainId state exists)
  // We use a selector directly for each candidate chainId
  const allAssetsByNetwork = useSelector((state) => {
    const result: Record<string, string[]> = {};
    for (const chainId of availableNetworkChainIds) {
      result[chainId] = getAvailableBatchSellAssetsForNetworkSelector(
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

  const availableBatchSellAssetsForNetworkList = useSelector((state) =>
    getAvailableBatchSellAssetsForNetworkSelector(
      state,
      selectedNetworkChainId,
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
    const bridgeToken =
      selectedAsset?.address === undefined
        ? undefined
        : {
            symbol: selectedAsset.symbol,
            address: selectedAsset.address,
            name: selectedAsset.name,
            chainId: selectedAsset.chainId,
          };

    transitionForward(() =>
      openBridgeExperience(MetaMetricsSwapsEventSource.MainView, bridgeToken),
    );
  }, [
    availableBatchSellAssetsForNetworkList,
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
    <Box flexDirection={BoxFlexDirection.Column} className="h-full">
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
