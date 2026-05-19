import { CaipAssetType } from '@metamask/utils';
import { type BridgeController } from '@metamask/bridge-controller';
import { BatchSellAsset } from '../../../../ducks/batch-sell/types';
import { BridgeAssetV2 } from '../../../bridge/utils/tokens';

export type BatchSellQuotesConfig = {
  sendAssetsConfig: {
    [assetId: CaipAssetType]: {
      asset: BatchSellAsset;
      sendAmountPercent: number;
      slippagePercent: number;
      enabled: boolean;
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
      quoteBpsFee?: string | number;
    };
  };
  receivedAsset: ReceivedAsset;
  totalReceivedAmount: number;
  totalReceivedAmountFiat: number;
  minimumReceivedAmount: number;
  totalNetworkFee: number;
  totalNetworkFeeFiat: number;
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
      asset: ReceivedAsset;
    };

export type ReceivedAsset = {
  id: CaipAssetType;
  symbol: string;
  fiatBalance?: number | null;
  image?: string | null;
  securityData?: BridgeAssetV2['securityData'];
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
  selectedReceiveAsset: ReceivedAsset;
  editingSlippageAssetId: CaipAssetType | null;
};
