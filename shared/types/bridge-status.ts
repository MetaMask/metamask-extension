import { TransactionMeta } from '@metamask/transaction-controller';
// TODO fix this
import {
  ChainId,
  Quote,
  QuoteMetadata,
  QuoteResponse,
  // eslint-disable-next-line import/no-restricted-paths
} from '../../ui/pages/bridge/types';

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
  /**
   * The txHash of the transaction on the source chain.
   * This might be undefined for smart transactions (STX)
   */
  txHash?: string;
  /**
   * The atomic amount of the token sent minus fees on the source chain
   */
  amount?: string;
  token?: Asset;
};

export type DestChainStatus = {
  chainId: ChainId;
  txHash?: string;
  /**
   * The atomic amount of the token received on the destination chain
   */
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
  completionTime?: number; // timestamp in ms
  pricingData?: {
    /**
     * From QuoteMetadata.sentAmount.amount, the actual amount sent by user in non-atomic decimal form
     */
    amountSent: string;
    amountSentInUsd?: string;
    quotedGasInUsd?: string; // from QuoteMetadata.gasFee.usd
    quotedReturnInUsd?: string; // from QuoteMetadata.toTokenAmount.usd
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

// The BigNumber values are serialized to strings when QuoteMetadata sent to the background
export type TokenAmountValuesSerialized = {
  amount: string;
  valueInCurrency: string | null;
  usd: string | null;
};

export type QuoteMetadataSerialized = {
  gasFee: TokenAmountValuesSerialized;
  /**
   * The total network fee for the bridge transaction
   * estimatedGasFees + relayerFees
   */
  totalNetworkFee: TokenAmountValuesSerialized;
  /**
   * The total max network fee for the bridge transaction
   * maxGasFees + relayerFees
   */
  totalMaxNetworkFee: TokenAmountValuesSerialized;
  toTokenAmount: TokenAmountValuesSerialized;
  /**
   * The adjusted return for the bridge transaction
   * destTokenAmount - totalNetworkFee
   */
  adjustedReturn: TokenAmountValuesSerialized;
  /**
   * The actual amount sent by user in non-atomic decimal form
   * srcTokenAmount + metabridgeFee
   */
  sentAmount: TokenAmountValuesSerialized;
  swapRate: string; // destTokenAmount / sentAmount
  /**
   * The cost of the bridge transaction
   * sentAmount - adjustedReturn
   */
  cost: {
    valueInCurrency: string | null;
    usd: string | null;
  };
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

export type BridgeStatusControllerState = {
  txHistory: Record<SourceChainTxMetaId, BridgeHistoryItem>;
};
