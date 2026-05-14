import { useReducer } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CaipAssetType } from '@metamask/utils';
import { BatchSellNavigationState } from '../../../../../hooks/batch-sell/useBatchSellNavigation';
import { BridgeAppState } from '../../../../../ducks/bridge/selectors';
import {
  getAvailableBatchSellReceiveAssetsForNetwork as getAvailableBatchSellReceivedAssetsForNetwork,
  getAvailableBatchSellSwapAssetsForNetwork,
} from '../../../../../ducks/batch-sell/selectors';
import {
  DEFAULT_SEND_AMOUNT_PERCENT,
  DEFAULT_SLIPPAGE_PERCENT,
} from '../../../../../constants/batch-sell';
import { BatchSellReviewStateActionType } from '../types';
import { batchSellReviewStateReducer } from '../reducers';
import { BatchSellAsset } from 'ui/ducks/batch-sell/types';

export const useBatchSellQuotesConfig = () => {
  const { state: locationState } = useLocation();
  const { selectedNetworkChainId, selectedAssetsId } = (locationState ??
    {}) as BatchSellNavigationState;

  const receivedAssets = useSelector((_state: BridgeAppState) =>
    getAvailableBatchSellReceivedAssetsForNetwork(
      _state,
      selectedNetworkChainId ?? undefined,
    ).map((asset) => ({
      id: asset.assetId,
      symbol: asset.symbol,
      fiatBalance: asset.tokenFiatAmount,
      image: asset.iconUrl,
    })),
  );

  const availableBatchSellAssetsForNetworkList = useSelector((_state) =>
    getAvailableBatchSellSwapAssetsForNetwork(
      _state,
      selectedNetworkChainId ?? null,
    ).filter((asset) => selectedAssetsId?.includes(asset.assetId)),
  );

  const [state, dispatch] = useReducer(
    batchSellReviewStateReducer,
    undefined,
    () => ({
      sendAssetsConfig: Object.fromEntries(
        availableBatchSellAssetsForNetworkList.map((asset) => [
          asset.assetId,
          {
            asset,
            sendAmountPercent: DEFAULT_SEND_AMOUNT_PERCENT,
            slippagePercent: DEFAULT_SLIPPAGE_PERCENT,
          },
        ]),
      ),
      selectedReceiveAsset: receivedAssets[0],
      editingSlippageAssetId: null,
    }),
  );

  const canDeleteAssets = Object.values(state.sendAssetsConfig).length > 2;

  const setSendAmountPercent = (asset: BatchSellAsset, percent: number) =>
    dispatch({
      type: BatchSellReviewStateActionType.SetSendAmountPercent,
      assetId: asset.assetId,
      percent,
    });

  const setSlippagePercent = (percent: number) => {
    if (!state.editingSlippageAssetId) {
      return;
    }
    dispatch({
      type: BatchSellReviewStateActionType.SetSlippagePercent,
      assetId: state.editingSlippageAssetId,
      percent,
    });
  };

  const deleteAsset = (asset: BatchSellAsset) =>
    dispatch({
      type: BatchSellReviewStateActionType.DeleteAsset,
      assetId: asset.assetId,
    });

  const setEditingSlippageAssetId = (assetId: CaipAssetType | null) =>
    dispatch({
      type: BatchSellReviewStateActionType.SetEditingSlippageAsset,
      assetId,
    });

  const selectReceivedAsset = (assetId: CaipAssetType) => {
    const newAsset = receivedAssets.find((asset) => asset.id === assetId);
    if (newAsset) {
      dispatch({
        type: BatchSellReviewStateActionType.SetSelectedReceiveAsset,
        asset: newAsset,
      });
    }
  };

  return {
    sendAssetsConfig: state.sendAssetsConfig,
    selectedReceiveAsset: state.selectedReceiveAsset,
    editingSlippageAssetId: state.editingSlippageAssetId,
    canDeleteAssets,
    receivedAssets,
    setSendAmountPercent,
    setSlippagePercent,
    setEditingSlippageAssetId,
    selectReceivedAsset,
    deleteAsset,
  };
};
