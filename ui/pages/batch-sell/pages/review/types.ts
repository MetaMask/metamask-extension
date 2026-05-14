import { CaipAssetType } from '@metamask/utils';
import { BatchSellAsset } from 'ui/ducks/batch-sell/types';

export type BatchSellQuotesConfig = {
  sendAssetsConfig: {
    [assetId: CaipAssetType]: {
      asset: BatchSellAsset;
      sendAmountPercent: number;
      slippagePercent: number;
    };
  };
  receivedAsset: ReceivedAsset;
};

export type BatchSellQuotesResults = {
  quotes: {
    [assetId: CaipAssetType]: {
      asset: BatchSellAsset;
      slippagePercent?: number;
      receivedAmount?: number;
      receivedAmountFiat?: number;
      minimumReceivedAmount?: number;
      hasQuote: boolean;
      hasHighPriceImpactWarning?: boolean;
    };
  };
  receivedAsset: ReceivedAsset;
  totalReceivedAmount: number;
  totalReceivedAmountFiat: number;
  minimumReceivedAmount: number;
};

export enum BatchSellReviewStateActionType {
  SetSendAmountPercent = 'SET_SEND_AMOUNT_PERCENT',
  SetSlippagePercent = 'SET_SLIPPAGE_PERCENT',
  DeleteAsset = 'DELETE_ASSET',
  SetEditingSlippageAsset = 'SET_EDITING_SLIPPAGE_ASSET',
  SetSelectedReceiveAsset = 'SET_SELECTED_RECEIVE_ASSET',
}

export type BatchSellReviewStateAction =
  | {
      type: BatchSellReviewStateActionType.SetSendAmountPercent;
      assetId: CaipAssetType;
      percent: number;
    }
  | {
      type: BatchSellReviewStateActionType.SetSlippagePercent;
      assetId: CaipAssetType;
      percent: number;
    }
  | { type: BatchSellReviewStateActionType.DeleteAsset; assetId: CaipAssetType }
  | {
      type: BatchSellReviewStateActionType.SetEditingSlippageAsset;
      assetId: CaipAssetType | null;
    }
  | {
      type: BatchSellReviewStateActionType.SetSelectedReceiveAsset;
      asset: ReceivedAsset;
    };

export type ReceivedAsset = {
  id: CaipAssetType;
  symbol: string;
  fiatBalance?: number | null;
  image?: string | null;
};

export type BatchSellReviewState = {
  sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'];
  selectedReceiveAsset: ReceivedAsset;
  editingSlippageAssetId: CaipAssetType | null;
};
