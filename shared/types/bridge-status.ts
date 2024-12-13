import { TransactionMeta } from '@metamask/transaction-controller';
import { ChainId, Quote, QuoteMetadata, QuoteResponse } from './bridge';

// All fields need to be types not interfaces, same with their children fields
// o/w you get a type error

export enum StatusTypes {
  UNKNOWN = 'UNKNOWN',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
}

export type StatusRequest = {
  bridgeId: string; // lifi, socket, squid
  srcTxHash?: string; // lifi, socket, squid, might be undefined for STX
  bridge: string; // lifi, socket, squid
  srcChainId: ChainId; // lifi, socket, squid
  destChainId: ChainId; // lifi, socket, squid
  quote?: Quote; // squid
  refuel?: boolean; // lifi
};

export type StatusRequestDto = Omit<
  StatusRequest,
  'quote' | 'srcChainId' | 'destChainId' | 'refuel'
> & {
  srcChainId: string; // lifi, socket, squid
  destChainId: string; // lifi, socket, squid
  requestId?: string;
  refuel?: string; // lifi
};

export type StatusRequestWithSrcTxHash = StatusRequest & {
  srcTxHash: string;
};

export type Asset = {
  chainId: ChainId;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string | null;
};

export type SrcChainStatus = {
  chainId: ChainId;
  txHash?: string; // might be undefined if this is a smart transaction (STX)
  amount?: string;
  token?: Asset;
};

export type DestChainStatus = {
  chainId: ChainId;
  txHash?: string;
  amount?: string;
  token?: Record<string, never> | Asset;
};

export enum BridgeId {
  HOP = 'hop',
  CELER = 'celer',
  CELERCIRCLE = 'celercircle',
  CONNEXT = 'connext',
  POLYGON = 'polygon',
  AVALANCHE = 'avalanche',
  MULTICHAIN = 'multichain',
  AXELAR = 'axelar',
  ACROSS = 'across',
  STARGATE = 'stargate',
}

export enum FeeType {
  METABRIDGE = 'metabridge',
  REFUEL = 'refuel',
}

export type FeeData = {
  amount: string;
  asset: Asset;
};

export type Protocol = {
  displayName?: string;
  icon?: string;
  name?: string; // for legacy quotes
};

export enum ActionTypes {
  BRIDGE = 'bridge',
  SWAP = 'swap',
  REFUEL = 'refuel',
}

export type Step = {
  action: ActionTypes;
  srcChainId: ChainId;
  destChainId?: ChainId;
  srcAsset: Asset;
  destAsset: Asset;
  srcAmount: string;
  destAmount: string;
  protocol: Protocol;
};

export type StatusResponse = {
  status: StatusTypes;
  srcChain: SrcChainStatus;
  destChain?: DestChainStatus;
  bridge?: BridgeId;
  isExpectedToken?: boolean;
  isUnrecognizedRouterAddress?: boolean;
  refuel?: RefuelStatusResponse;
};

export type RefuelStatusResponse = object & StatusResponse;

export type RefuelData = object & Step;

export type BridgeHistoryItem = {
  txMetaId: string; // Need this to handle STX that might not have a txHash immediately
  quote: Quote;
  status: StatusResponse;
  startTime?: number; // timestamp in ms
  estimatedProcessingTimeInSeconds: number;
  slippagePercentage: number;
  completionTime?: number;
  pricingData?: {
    amountSent: string; // This is from QuoteMetadata.sentAmount.amount, the actual amount sent by user in non-atomic decimal form

    quotedGasInUsd?: string;
    quotedReturnInUsd?: string;
    amountSentInUsd?: string;
    quotedRefuelSrcAmountInUsd?: string;
    quotedRefuelDestAmountInUsd?: string;
  };
  initialDestAssetBalance?: string;
  targetContractAddress?: string;
  account: string;
};

export enum BridgeStatusAction {
  START_POLLING_FOR_BRIDGE_TX_STATUS = 'startPollingForBridgeTxStatus',
  WIPE_BRIDGE_STATUS = 'wipeBridgeStatus',
  GET_STATE = 'getState',
}

// The BigNumber values are serialized to strings
export type QuoteMetadataSerialized = {
  sentAmount: { amount: string; fiat: string | null };
};

export type StartPollingForBridgeTxStatusArgs = {
  bridgeTxMeta: TransactionMeta;
  statusRequest: StatusRequest;
  quoteResponse: QuoteResponse & QuoteMetadata;
  startTime?: BridgeHistoryItem['startTime'];
  slippagePercentage: BridgeHistoryItem['slippagePercentage'];
  initialDestAssetBalance?: BridgeHistoryItem['initialDestAssetBalance'];
  targetContractAddress?: BridgeHistoryItem['targetContractAddress'];
};

export type StartPollingForBridgeTxStatusArgsSerialized = Omit<
  StartPollingForBridgeTxStatusArgs,
  'quoteResponse'
> & {
  quoteResponse: QuoteResponse & QuoteMetadataSerialized;
};

export type SourceChainTxMetaId = string;

export type BridgeStatusState = {
  txHistory: Record<SourceChainTxMetaId, BridgeHistoryItem>;
};

export type BridgeStatusControllerState = {
  bridgeStatusState: BridgeStatusState;
};
