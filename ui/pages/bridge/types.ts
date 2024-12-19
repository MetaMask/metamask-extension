import { BigNumber } from 'bignumber.js';
import { Hex } from '@metamask/utils';
import { ChainConfiguration } from '../../../shared/types/bridge';
import type { AssetType } from '../../../shared/constants/transaction';

export type L1GasFees = {
  l1GasFeesInHexWei?: string; // l1 fees for approval and trade in hex wei, appended by controller
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
  // estimatedGasFees + relayerFees
  totalNetworkFee: TokenAmountValues;
  // maxGasFees + relayerFees
  totalMaxNetworkFee: TokenAmountValues;
  // destTokenAmount
  toTokenAmount: TokenAmountValues;
  // destTokenAmount - totalNetworkFee
  adjustedReturn: Omit<TokenAmountValues, 'amount'>;
  // srcTokenAmount + metabridgeFee
  sentAmount: TokenAmountValues;
  swapRate: BigNumber; // destTokenAmount / sentAmount
  // sentAmount - adjustedReturn
  cost: Omit<TokenAmountValues, 'amount'>;
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
