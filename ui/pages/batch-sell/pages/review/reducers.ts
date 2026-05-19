import {
  BatchSellReviewState,
  BatchSellReviewStateAction,
  BatchSellReviewStateActionType,
} from './types';

export const batchSellReviewStateReducer = (
  state: BatchSellReviewState,
  action: BatchSellReviewStateAction,
): BatchSellReviewState => {
  switch (action.type) {
    case BatchSellReviewStateActionType.SetSendAmountPercent:
      return {
        ...state,
        sendAssetsConfig: {
          ...state.sendAssetsConfig,
          [action.assetId]: {
            ...state.sendAssetsConfig[action.assetId],
            sendAmountPercent: action.percent,
          },
        },
      };

    case BatchSellReviewStateActionType.SetEnabled:
      return {
        ...state,
        sendAssetsConfig: {
          ...state.sendAssetsConfig,
          [action.assetId]: {
            ...state.sendAssetsConfig[action.assetId],
            enabled: action.enabled,
          },
        },
      };

    case BatchSellReviewStateActionType.SetSlippagePercent:
      return {
        ...state,
        sendAssetsConfig: {
          ...state.sendAssetsConfig,
          [action.assetId]: {
            ...state.sendAssetsConfig[action.assetId],
            slippagePercent: action.percent,
          },
        },
        editingSlippageAssetId: null,
      };

    case BatchSellReviewStateActionType.DeleteAsset: {
      const { [action.assetId]: _removed, ...remaining } =
        state.sendAssetsConfig;
      return { ...state, sendAssetsConfig: remaining };
    }

    case BatchSellReviewStateActionType.SetEditingSlippageAsset:
      return { ...state, editingSlippageAssetId: action.assetId };

    case BatchSellReviewStateActionType.SetSelectedReceiveAsset:
      return { ...state, selectedReceiveAsset: action.asset };

    default:
      return state;
  }
};
