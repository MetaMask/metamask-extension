import { useReducer } from 'react';
import { useSelector } from 'react-redux';
import { CaipAssetType } from '@metamask/utils';
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
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import { useBatchSellSelection } from '../../../providers/batch-sell-selection-provider';
import { useSortBatchSellAssetsByBalance } from '../../../../../hooks/batch-sell/useSortBatchSellAssetsByBalance';

export const useBatchSellQuotesConfig = () => {
  const {
    selectedNetworkChainId,
    selectedAssetsId,
    assetsOrderByBalance,
    setSelectedAssetsId,
  } = useBatchSellSelection();

  const receivedAssets = useSelector((_state: BridgeAppState) =>
    getAvailableBatchSellReceivedAssetsForNetwork(
      _state,
      selectedNetworkChainId ?? undefined,
    ),
  );

  const selectedAvailableBatchSellAssetsForNetworkList = useSelector(
    (_state: BridgeAppState) =>
      getAvailableBatchSellSwapAssetsForNetwork(
        _state,
        selectedNetworkChainId ?? null,
      ).filter((asset) => selectedAssetsId?.includes(asset.assetId)),
  );

  const availableBatchSellAssetsForNetworkList =
    useSortBatchSellAssetsByBalance(
      selectedAvailableBatchSellAssetsForNetworkList,
      assetsOrderByBalance,
    );

  const hasInitialSelection =
    Boolean(selectedAssetsId?.length) &&
    availableBatchSellAssetsForNetworkList.length > 0;

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
            enabled: true,
          },
        ]),
      ),
      selectedReceiveAsset: receivedAssets[0],
      editingSlippageAssetId: null,
    }),
  );

  const canDeleteAssets = Object.values(state.sendAssetsConfig).length > 2;

  const setSendAmountPercent = (asset: BatchSellAsset, percent: number) => {
    dispatch({
      type: BatchSellReviewStateActionType.SetSendAmountPercent,
      assetId: asset.assetId,
      percent,
    });
    dispatch({
      type: BatchSellReviewStateActionType.SetEnabled,
      assetId: asset.assetId,
      enabled: percent > 0,
    });
  };

  const setEnabled = (asset: BatchSellAsset, enabled: boolean) =>
    dispatch({
      type: BatchSellReviewStateActionType.SetEnabled,
      assetId: asset.assetId,
      enabled,
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

  const deleteAsset = (asset: BatchSellAsset) => {
    dispatch({
      type: BatchSellReviewStateActionType.DeleteAsset,
      assetId: asset.assetId,
    });
    setSelectedAssetsId((ids) => ids.filter((id) => id !== asset.assetId));
  };

  const setEditingSlippageAssetId = (assetId: CaipAssetType | null) =>
    dispatch({
      type: BatchSellReviewStateActionType.SetEditingSlippageAsset,
      assetId,
    });

  const selectReceivedAsset = (assetId: CaipAssetType) => {
    const newAsset = receivedAssets.find((asset) => asset.assetId === assetId);
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
    hasInitialSelection,
    setSendAmountPercent,
    setEnabled,
    setSlippagePercent,
    setEditingSlippageAssetId,
    selectReceivedAsset,
    deleteAsset,
  };
};
