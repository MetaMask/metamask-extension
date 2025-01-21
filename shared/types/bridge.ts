import type { Hex } from '@metamask/utils';
import type { BigNumber } from 'bignumber.js';
import type { AssetType } from '../constants/transaction';
import type { SwapsTokenObject } from '../constants/swaps';

export type ChainConfiguration = {
  isActiveSrc: boolean;
  isActiveDest: boolean;
};

export type L1GasFees = {
  l1GasFeesInHexWei?: string; // l1 fees for approval and trade in hex wei, appended by controller
};
// Values derived from the quote response
// valueInCurrency values are calculated based on the user's selected currency

export type QuoteMetadata = {
  gasFee: { amount: BigNumber; valueInCurrency: BigNumber | null };
  totalNetworkFee: { amount: BigNumber; valueInCurrency: BigNumber | null }; // estimatedGasFees + relayerFees
  totalMaxNetworkFee: { amount: BigNumber; valueInCurrency: BigNumber | null }; // maxGasFees + relayerFees
  toTokenAmount: { amount: BigNumber; valueInCurrency: BigNumber | null };
  adjustedReturn: { valueInCurrency: BigNumber | null }; // destTokenAmount - totalNetworkFee
  sentAmount: { amount: BigNumber; valueInCurrency: BigNumber | null }; // srcTokenAmount + metabridgeFee
  swapRate: BigNumber; // destTokenAmount / sentAmount
  cost: { valueInCurrency: BigNumber | null }; // sentAmount - adjustedReturn
};
// Sort order set by the user

export enum SortOrder {
  COST_ASC = 'cost_ascending',
  ETA_ASC = 'time_descending',
}

export type BridgeToken = {
  type: AssetType.native | AssetType.token;
  address: string;
  symbol: string;
  image: string;
  decimals: number;
  chainId: Hex;
  balance: string; // raw balance
  string: string | undefined; // normalized balance as a stringified number
  tokenFiatAmount?: number | null;
} | null;
// Types copied from Metabridge API

export enum BridgeFlag {
  EXTENSION_CONFIG = 'extension-config',
}
type DecimalChainId = string;
export type GasMultiplierByChainId = Record<DecimalChainId, number>;

export type FeatureFlagResponse = {
  [BridgeFlag.EXTENSION_CONFIG]: {
    refreshRate: number;
    maxRefreshCount: number;
    support: boolean;
    chains: Record<number, ChainConfiguration>;
  };
};

export type BridgeAsset = {
  chainId: ChainId;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
};

export type QuoteRequest = {
  walletAddress: string;
  destWalletAddress?: string;
  srcChainId: ChainId;
  destChainId: ChainId;
  srcTokenAddress: string;
  destTokenAddress: string;
  srcTokenAmount: string; // This is the amount sent
  slippage: number;
  aggIds?: string[];
  bridgeIds?: string[];
  insufficientBal?: boolean;
  resetApproval?: boolean;
  refuel?: boolean;
};
type Protocol = {
  name: string;
  displayName?: string;
  icon?: string;
};
enum ActionTypes {
  BRIDGE = 'bridge',
  SWAP = 'swap',
  REFUEL = 'refuel',
}
type Step = {
  action: ActionTypes;
  srcChainId: ChainId;
  destChainId?: ChainId;
  srcAsset: BridgeAsset;
  destAsset: BridgeAsset;
  srcAmount: string;
  destAmount: string;
  protocol: Protocol;
};
type RefuelData = Step;

export type Quote = {
  requestId: string;
  srcChainId: ChainId;
  srcAsset: BridgeAsset;
  // Some tokens have a fee of 0, so sometimes it's equal to amount sent
  srcTokenAmount: string; // Atomic amount, the amount sent - fees
  destChainId: ChainId;
  destAsset: BridgeAsset;
  destTokenAmount: string; // Atomic amount, the amount received
  feeData: Record<FeeType.METABRIDGE, FeeData> &
    Partial<Record<FeeType, FeeData>>;
  bridgeId: string;
  bridges: string[];
  steps: Step[];
  refuel?: RefuelData;
};

export type QuoteResponse = {
  quote: Quote;
  approval: TxData | null;
  trade: TxData;
  estimatedProcessingTimeInSeconds: number;
};

export enum ChainId {
  ETH = 1,
  OPTIMISM = 10,
  BSC = 56,
  POLYGON = 137,
  ZKSYNC = 324,
  BASE = 8453,
  ARBITRUM = 42161,
  AVALANCHE = 43114,
  LINEA = 59144,
}

export enum FeeType {
  METABRIDGE = 'metabridge',
  REFUEL = 'refuel',
}
export type FeeData = {
  amount: string;
  asset: BridgeAsset;
};
export type TxData = {
  chainId: ChainId;
  to: string;
  from: string;
  value: string;
  data: string;
  gasLimit: number | null;
};
export enum BridgeFeatureFlagsKey {
  EXTENSION_CONFIG = 'extensionConfig',
}

export type BridgeFeatureFlags = {
  [BridgeFeatureFlagsKey.EXTENSION_CONFIG]: {
    refreshRate: number;
    maxRefreshCount: number;
    support: boolean;
    chains: Record<Hex, ChainConfiguration>;
  };
};
export enum RequestStatus {
  LOADING,
  FETCHED,
  ERROR,
}
export enum BridgeUserAction {
  SELECT_DEST_NETWORK = 'selectDestNetwork',
  UPDATE_QUOTE_PARAMS = 'updateBridgeQuoteRequestParams',
}
export enum BridgeBackgroundAction {
  SET_FEATURE_FLAGS = 'setBridgeFeatureFlags',
  RESET_STATE = 'resetState',
  GET_BRIDGE_ERC20_ALLOWANCE = 'getBridgeERC20Allowance',
}
export type BridgeControllerState = {
  bridgeFeatureFlags: BridgeFeatureFlags;
  destTokensLoadingStatus?: RequestStatus;
  destTokens: Record<string, SwapsTokenObject>;
  destTopAssets: { address: string }[];
  quoteRequest: Partial<QuoteRequest>;
  quotes: (QuoteResponse & L1GasFees)[];
  quotesInitialLoadTime?: number;
  quotesLastFetched?: number;
  quotesLoadingStatus?: RequestStatus;
  quoteFetchError?: string;
  quotesRefreshCount: number;
};
