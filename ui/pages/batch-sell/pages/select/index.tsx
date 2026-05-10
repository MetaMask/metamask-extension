import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { CaipChainId } from '@metamask/utils';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import {
  getAvailableBatchSellAssetsForNetworkSelector,
  getAvailableBatchSellNetworksSelector,
  selectBatchSellDestStablecoins,
} from '../../../../ducks/batch-sell/selectors';
import type { BridgeAppState } from '../../../../ducks/bridge/selectors';
import { BatchSellAsset } from '../../../../ducks/batch-sell/types';
import { useSortBatchSellAssetsByBalance } from '../../../../hooks/batch-sell/useSortBatchSellAssetsByBalance';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useBatchSellnfoModal } from '../../hooks/useBatchSellInfoModal';
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

// TODO: go throught the acceptance criteria and verify all cases
// TODO: start working on the select screen

export const BatchSellSelectPage = () => {
  const t = useI18nContext();
  const { openBridgeExperience } = useBridging();
  const { openModal, closeModal } = useBatchSellnfoModal();
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

  const batchSellDestStablecoins = useSelector((state: BridgeAppState) =>
    selectBatchSellDestStablecoins(state, selectedNetworkChainId ?? undefined),
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
    const sourceToken =
      selectedAsset?.address === undefined
        ? undefined
        : {
            symbol: selectedAsset.symbol,
            address: selectedAsset.address,
            name: selectedAsset.name,
            chainId: selectedAsset.chainId,
          };

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
