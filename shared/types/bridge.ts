import type {
  CaipAccountId,
  CaipAssetId,
  CaipChainId,
  Hex,
} from '@metamask/utils';
import type { BigNumber } from 'bignumber.js';

export type ChainConfiguration = {
  isActiveSrc: boolean;
  isActiveDest: boolean;
  refreshRate?: number;
  topAssets?: string[];
};

export type L1GasFees = {
  l1GasFeesInHexWei?: string; // l1 fees for approval and trade in hex wei, appended by controller
};

export type SolanaFees = {
  solanaFeesInLamports?: string; // solana fees in lamports, appended by controller
};

// Values derived from the quote response
// valueInCurrency values are calculated based on the user's selected currency
export type TokenAmountValues = {
  amount: BigNumber;
  valueInCurrency: BigNumber | null;
  usd: BigNumber | null;
};
export type QuoteMetadata = {
  gasFee: TokenAmountValues;
  totalNetworkFee: TokenAmountValues; // estimatedGasFees + relayerFees
  totalMaxNetworkFee: TokenAmountValues; // maxGasFees + relayerFees
  toTokenAmount: TokenAmountValues; // destTokenAmount
  adjustedReturn: Omit<TokenAmountValues, 'amount'>; // destTokenAmount - totalNetworkFee
  sentAmount: TokenAmountValues; // srcTokenAmount + metabridgeFee
  swapRate: BigNumber; // destTokenAmount / sentAmount
  cost: Omit<TokenAmountValues, 'amount'>; // sentAmount - adjustedReturn
};
// Sort order set by the user

export enum SortOrder {
  COST_ASC = 'cost_ascending',
  ETA_ASC = 'time_descending',
}

export type BridgeToken = {
  address: string;
  symbol: string;
  image: string;
  decimals: number;
  chainId: number | Hex | ChainId | CaipChainId;
  balance: string; // raw balance
  string: string | undefined; // normalized balance as a stringified number
  tokenFiatAmount?: number | null;
};
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

// Generic types for the quote request
// Only the controller and reducer should be overriding these types to prepare the fetch request
export type QuoteRequest<
  ChainIdType = ChainId | number,
  TokenAddressType = string,
  WalletAddressType = string,
> = {
  walletAddress: WalletAddressType;
  destWalletAddress?: WalletAddressType;
  srcChainId: ChainIdType;
  destChainId: ChainIdType;
  srcTokenAddress: TokenAddressType;
  destTokenAddress: TokenAddressType;
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
  srcAsset?: BridgeAsset;
  destAsset?: BridgeAsset;
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
  SOLANA = 1151111081099710,
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
    chains: Record<CaipChainId, ChainConfiguration>;
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

// These are types that components pass in. Since data is a mix of types when coming from the redux store, we need to use a generic type that can cover all the types.
// This is formatted by fetchBridgeQuotes right before fetching quotes to whatever type the bridge-api is expecting.
export type GenericQuoteRequest = QuoteRequest<
  Hex | CaipChainId | string | number, // chainIds
  Hex | CaipAssetId | string, // assetIds/addresses
  Hex | CaipAccountId | string // accountIds/addresses
>;

export type BridgeState = {
  bridgeFeatureFlags: BridgeFeatureFlags;
  quoteRequest: Partial<GenericQuoteRequest>;
  quotes: (QuoteResponse & L1GasFees & SolanaFees)[];
  quotesInitialLoadTime?: number;
  quotesLastFetched?: number;
  quotesLoadingStatus?: RequestStatus;
  quoteFetchError?: string;
  quotesRefreshCount: number;
};

export type BridgeControllerState = {
  bridgeState: BridgeState;
};

export type TokenV3Asset = {
  assetId: string;
  symbol: string;
  name: string;
  decimals: number;
};
