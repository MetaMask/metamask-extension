import { CaipAssetType } from '@metamask/utils';
import { BatchSellAsset } from 'ui/ducks/batch-sell/types';

export type BatchSellQuotesConfig = {
  sendAssets: {
    [assetId: CaipAssetType]: {
      asset: BatchSellAsset;
      sendAmountPercent: number;
      slippagePercent: number;
    };
  };
  receivedAsset: BatchSellAsset;
}

export type BatchSellQuotesResults = {
  quotes: {
    [assetId: CaipAssetType]:
      | {
          asset: BatchSellAsset;
          slippagePercent: number;
          receivedAmount: number;
          receivedAmountFiat: number;
          minimumReceivedAmount: number;
          hasQuote: true;
          hasHighPriceImpactWarning: boolean;
        }
      | {
          asset: BatchSellAsset;
          slippagePercent: undefined;
          receivedAmount: undefined;
          receivedAmountFiat: undefined;
          minimumReceivedAmount: undefined;
          hasQuote: false;
          hasHighPriceImpactWarning: boolean;
        };
  };
  receivedAsset: BatchSellAsset;
  totalReceivedAmount: number;
  totalReceivedAmountFiat: number;
  minimumReceivedAmount: number;
}

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
  quoteConfigs: BatchSellQuotesConfig['sendAssets'];
  selectedReceiveAsset: ReceivedAsset;
  editingSlippageAssetId: CaipAssetType | null;
};
