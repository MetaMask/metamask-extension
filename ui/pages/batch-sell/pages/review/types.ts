import { CaipAssetType } from '@metamask/utils';
import { type BridgeController } from '@metamask/bridge-controller';
import { BatchSellAsset } from '../../../../ducks/batch-sell/types';
import type { getBatchSellQuotes } from '../../../../ducks/batch-sell/selectors';

export type BatchSellQuotesConfig = {
  sendAssetsConfig: {
    [assetId: CaipAssetType]: {
      asset: BatchSellAsset;
      sendAmountPercent: number;
      slippagePercent: number;
      enabled: boolean;
    };
  };
  receivedAsset: BatchSellAsset;
};

export type RecommendedQuote = ReturnType<
  typeof getBatchSellQuotes
>['recommendedQuotes'][number];

export type BatchSellQuotesResults = {
  quotes: {
    [assetId: CaipAssetType]: {
      asset: BatchSellAsset;
      quote: RecommendedQuote;
      slippagePercent?: number;
      receivedAmount?: number;
      receivedAmountFiat?: number;
      minimumReceivedAmount?: number;
      hasQuote: boolean;
      isLoadingQuote: boolean;
      hasHighPriceImpactWarning?: boolean;
      quoteBpsFee?: string | number;
    };
  };
  receivedAsset: BatchSellAsset;
  totalReceivedAmount?: number;
  totalReceivedAmountFiat?: number;
  minimumReceivedAmount?: number;
};

export enum BatchSellReviewStateActionType {
  SetSendAmountPercent = 'SET_SEND_AMOUNT_PERCENT',
  SetSlippagePercent = 'SET_SLIPPAGE_PERCENT',
  SetEnabled = 'SET_ENABLED',
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
  | {
      type: BatchSellReviewStateActionType.SetEnabled;
      assetId: CaipAssetType;
      enabled: boolean;
    }
  | { type: BatchSellReviewStateActionType.DeleteAsset; assetId: CaipAssetType }
  | {
      type: BatchSellReviewStateActionType.SetEditingSlippageAsset;
      assetId: CaipAssetType | null;
    }
  | {
      type: BatchSellReviewStateActionType.SetSelectedReceiveAsset;
      asset: BatchSellAsset;
    };

export type SendAssetEntry = {
  assetId: CaipAssetType;
  asset: BatchSellAsset;
  sendAmountPercent: number;
  slippagePercent: number;
  enabled: boolean;
};

export type QuoteRequestParams = Parameters<
  BridgeController['updateBridgeQuoteRequestParams']
>[0];

export type QuoteRequestContext = Parameters<
  BridgeController['updateBridgeQuoteRequestParams']
>[1];

export type BatchSellReviewState = {
  sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'];
  selectedReceiveAsset: BatchSellAsset;
  editingSlippageAssetId: CaipAssetType | null;
};

export type BatchSellValidationResult = {
  isNoQuotesAvailable: boolean;
  nativeAssetSymbol?: string;
};

export type BatchSellQuotesControllerResult = ReturnType<
  typeof getBatchSellQuotes
>;
