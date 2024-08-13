// Types copied from Metabridge API
export enum BridgeFlag {
  EXTENSION_SUPPORT = 'extension-support',
  NETWORK_SRC_ALLOWLIST = 'src-network-allowlist',
  NETWORK_DEST_ALLOWLIST = 'dest-network-allowlist',
}

export type FeatureFlagResponse = {
  [BridgeFlag.EXTENSION_SUPPORT]: boolean;
  [BridgeFlag.NETWORK_SRC_ALLOWLIST]: number[];
  [BridgeFlag.NETWORK_DEST_ALLOWLIST]: number[];
};

export type BridgeAsset = {
  chainId: ChainId;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
};

export const isValidQuoteRequest = (
  partialRequest: Partial<QuoteRequest>,
): partialRequest is QuoteRequest => {
  const STRING_FIELDS = [
    'srcTokenAddress',
    'srcTokenAmount',
    'destTokenAddress',
  ];
  const NUMBER_FIELDS = ['srcChainId', 'destChainId', 'slippage'];

  return (
    STRING_FIELDS.every(
      (field) =>
        field in partialRequest &&
        typeof partialRequest[field as keyof typeof partialRequest] ===
          'string' &&
        partialRequest[field as keyof typeof partialRequest] !== undefined &&
        partialRequest[field as keyof typeof partialRequest] !== '' &&
        partialRequest[field as keyof typeof partialRequest] !== null,
    ) &&
    NUMBER_FIELDS.every(
      (field) =>
        field in partialRequest &&
        typeof partialRequest[field as keyof typeof partialRequest] ===
          'number' &&
        partialRequest[field as keyof typeof partialRequest] !== undefined &&
        !isNaN(Number(partialRequest[field as keyof typeof partialRequest])) &&
        partialRequest[field as keyof typeof partialRequest] !== null,
    )
  );
};

export type QuoteRequest = {
  walletAddress: string;
  destWalletAddress?: string;
  srcChainId: ChainId;
  destChainId: ChainId;
  srcTokenAddress: string;
  destTokenAddress: string;
  srcTokenAmount: string;
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
  srcTokenAmount: string;
  destChainId: ChainId;
  destAsset: BridgeAsset;
  destTokenAmount: string;
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

enum ChainId {
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

enum FeeType {
  METABRIDGE = 'metabridge',
  REFUEL = 'refuel',
}
type FeeData = {
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
