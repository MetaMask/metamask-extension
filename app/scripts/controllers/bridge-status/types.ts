import {
  ControllerStateChangeEvent,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { BRIDGE_STATUS_CONTROLLER_NAME } from './constants';
import BridgeStatusController from './bridge-status-controller';
import { Hex } from '@metamask/utils';

type HexChainId = Hex;

export interface Asset {
  chainId: HexChainId;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}

export interface ChainStatus {
  chainId: HexChainId;
  txHash: string;
  amount?: string;
  token?: Asset;
}

export enum StatusTypes {
  UNKNOWN = 'UNKNOWN',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
}

export interface RefuelStatusResponse extends StatusResponse {}

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

export interface StatusResponse {
  status: StatusTypes;
  srcChain: ChainStatus;
  destChain?: ChainStatus;
  bridge?: BridgeId;
  isExpectedToken?: boolean;
  isUnrecognizedRouterAddress?: boolean;
  refuel?: RefuelStatusResponse;
}

export enum FeeType {
  METABRIDGE = 'metabridge',
  REFUEL = 'refuel',
}

export interface FeeData {
  amount: string;
  asset: Asset;
}

export interface Protocol {
  displayName?: string;
  icon?: string;
  name?: string; // for legacy quotes
}

export enum ActionTypes {
  BRIDGE = 'bridge',
  SWAP = 'swap',
  REFUEL = 'refuel',
}

export interface Step {
  action: ActionTypes;
  srcChainId: HexChainId;
  destChainId?: HexChainId;
  srcAsset: Asset;
  destAsset: Asset;
  srcAmount: string;
  destAmount: string;
  protocol: Protocol;
}
export interface RefuelData extends Step {}

export interface Quote {
  requestId: string;
  srcChainId: HexChainId;
  srcAsset: Asset;
  srcTokenAmount: string;
  destChainId: HexChainId;
  destAsset: Asset;
  destTokenAmount: string;
  feeData: Record<FeeType.METABRIDGE, FeeData> &
    Partial<Record<FeeType, FeeData>>;
  bridgeId: string;
  bridges: string[];
  steps: Step[];
  refuel?: RefuelData;
}

export type BridgeHistoryItem = {
  quote: Quote;
  status: StatusResponse;
  startTime?: number;
  estimatedProcessingTimeInSeconds: number;
  slippagePercentage: number;
  completionTime?: number;
  pricingData?: {
    quotedGasInUsd: number;
    quotedReturnInUsd: number;
    amountSentInUsd: number;
    quotedRefuelSrcAmountInUsd?: number;
    quotedRefuelDestAmountInUsd?: number;
  };
  initialDestAssetBalance?: number;
  targetContractAddress?: string;
};

export type BridgeStatusControllerState = {};

export enum BridgeStatusAction {
  GET_BRIDGE_TX_STATUS = 'getBridgeTxStatus',
}

type BridgeStatusControllerAction<
  FunctionName extends keyof BridgeStatusController,
> = {
  type: `${typeof BRIDGE_STATUS_CONTROLLER_NAME}:${FunctionName}`;
  handler: BridgeStatusController[FunctionName];
};

// Maps to BridgeController function names
type BridgeStatusControllerActions =
  BridgeStatusControllerAction<BridgeStatusAction.GET_BRIDGE_TX_STATUS>;

type BridgeStatusControllerEvents = ControllerStateChangeEvent<
  typeof BRIDGE_STATUS_CONTROLLER_NAME,
  BridgeStatusControllerState
>;

/**
 * The messenger for the BridgeStatusController.
 */
export type BridgeStatusControllerMessenger = RestrictedControllerMessenger<
  typeof BRIDGE_STATUS_CONTROLLER_NAME,
  BridgeStatusControllerActions,
  BridgeStatusControllerEvents,
  never,
  never
>;
