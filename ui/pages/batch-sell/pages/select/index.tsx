import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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

// TODO: filter out stable coins
// TODO: submit and navigate to confirm screen
// TODO: should we exclude more action from assets?

export const BatchSellSelectPage = () => {
  const t = useI18nContext();
  const { openBridgeExperience } = useBridging();
  const { openModal, closeModal } = useBatchSellModal();

  const [assetsOrderByBalance, setAssetsOrderByBalance] = useState<
    'asc' | 'desc'
  >('desc');

  const availableBatchSellNetworksList = useSelector(
    getAvailableBatchSellNetworksSelector,
  );

  const [selectedNetworkChainId, setSelectedNetworkChainId] =
    useState<CaipChainId | null>(
      availableBatchSellNetworksList[0]?.chainId ?? null,
    );

  const [selectedAssetsId, setSelectedAssetsId] = useState<string[]>([]);

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
          onClick: () => {
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
              openBridgeExperience(
                MetaMetricsSwapsEventSource.MainView,
                bridgeToken,
              ),
            );
          },
        },
      });
      return;
    }

    console.log('submit');
  }, [
    selectedAssetsId,
    openModal,
    closeModal,
    openBridgeExperience,
    availableBatchSellAssetsForNetworkList,
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
