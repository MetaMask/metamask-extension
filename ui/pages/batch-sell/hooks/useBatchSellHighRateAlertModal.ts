import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { formatAddressToCaipReference } from '@metamask/bridge-controller';
import { CaipAssetType } from '@metamask/utils';
import type { BridgeAppState } from '../../../ducks/bridge/selectors';
import { getBatchSellDestStablecoinsForNetwork } from '../../../ducks/batch-sell/selectors';
import { useBatchSellSelection } from '../providers/batch-sell-selection-provider';
import { transitionForward } from '../../../components/ui/transition';
import useBridging from '../../../hooks/bridge/useBridging';
import { MetaMetricsSwapsEventSource } from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BatchSellAsset } from '../../../ducks/batch-sell/types';
import { useBatchSellInfoModal } from './useBatchSellInfoModal';

export const useBatchSellHighRateAlertModal = () => {
  const t = useI18nContext();
  const { openModal, closeModal: closeHighAlertModal } =
    useBatchSellInfoModal();
  const { openBridgeExperience } = useBridging();
  const { selectedNetworkChainId } = useBatchSellSelection();
  const batchSellDestStablecoins = useSelector((state: BridgeAppState) =>
    getBatchSellDestStablecoinsForNetwork(
      state,
      selectedNetworkChainId ?? undefined,
    ),
  );

  const navigateToBridgePageAndPreselect = useCallback(
    (sourceAsset: BatchSellAsset | undefined, destAssetId: CaipAssetType) =>
      () => {
        closeHighAlertModal();
        const sourceToken = sourceAsset
          ? {
              symbol: sourceAsset.symbol,
              address: formatAddressToCaipReference(sourceAsset.assetId),
              name: sourceAsset.name,
              chainId: sourceAsset.chainId,
            }
          : undefined;

        transitionForward(() =>
          openBridgeExperience(
            MetaMetricsSwapsEventSource.MainView,
            sourceToken,
            destAssetId,
          ),
        );
      },
    [batchSellDestStablecoins, closeHighAlertModal, openBridgeExperience],
  );

  const openHighAlertModal = useCallback(
    (sourceAsset: BatchSellAsset | undefined, destAssetId: CaipAssetType) => {
      openModal({
        titleProps: {
          children: t('batchSellHighRateAlert'),
        },
        descriptionProps: {
          children: t('batchSellHightRateAlertModalDescription'),
        },
        ctaProps: {
          text: t('yesSwap'),
          onClick: navigateToBridgePageAndPreselect(sourceAsset, destAssetId),
        },
      });
    },
    [openModal, t, navigateToBridgePageAndPreselect],
  );

  return {
    openHighAlertModal,
    closeHighAlertModal,
  };
};
