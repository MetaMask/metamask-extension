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
        quoteConfigs: {
          ...state.quoteConfigs,
          [action.assetId]: {
            ...state.quoteConfigs[action.assetId],
            sendAmountPercent: action.percent,
          },
        },
      };

    case BatchSellReviewStateActionType.SetSlippagePercent:
      return {
        ...state,
        quoteConfigs: {
          ...state.quoteConfigs,
          [action.assetId]: {
            ...state.quoteConfigs[action.assetId],
            slippagePercent: action.percent,
          },
        },
        editingSlippageAssetId: null,
      };

    case BatchSellReviewStateActionType.DeleteAsset: {
      const { [action.assetId]: _removed, ...remaining } = state.quoteConfigs;
      return { ...state, quoteConfigs: remaining };
    }

    case BatchSellReviewStateActionType.SetEditingSlippageAsset:
      return { ...state, editingSlippageAssetId: action.assetId };

    case BatchSellReviewStateActionType.SetSelectedReceiveAsset:
      return { ...state, selectedReceiveAsset: action.asset };

    default:
      return state;
  }
};
