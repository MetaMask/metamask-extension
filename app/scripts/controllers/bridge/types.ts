import {
  ControllerStateChangeEvent,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
} from '@metamask/network-controller';
import { SwapsTokenObject } from '../../../../shared/constants/swaps';
import type {
  BridgeBackgroundAction,
  BridgeFeatureFlags,
  BridgeUserAction,
  L1GasFees,
  QuoteRequest,
  QuoteResponse,
  RequestStatus,
} from '../../../../shared/types/bridge';
import BridgeController from './bridge-controller';
import { BRIDGE_CONTROLLER_NAME } from './constants';

export type BridgeControllerState = {
  bridgeFeatureFlags: BridgeFeatureFlags;
  srcTokens: Record<string, SwapsTokenObject>;
  srcTopAssets: { address: string }[];
  srcTokensLoadingStatus?: RequestStatus;
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

type BridgeControllerAction<FunctionName extends keyof BridgeController> = {
  type: `${typeof BRIDGE_CONTROLLER_NAME}:${FunctionName}`;
  handler: BridgeController[FunctionName];
};

// Maps to BridgeController function names
type BridgeControllerActions =
  | BridgeControllerAction<BridgeBackgroundAction.SET_FEATURE_FLAGS>
  | BridgeControllerAction<BridgeBackgroundAction.RESET_STATE>
  | BridgeControllerAction<BridgeBackgroundAction.GET_BRIDGE_ERC20_ALLOWANCE>
  | BridgeControllerAction<BridgeUserAction.SELECT_SRC_NETWORK>
  | BridgeControllerAction<BridgeUserAction.SELECT_DEST_NETWORK>
  | BridgeControllerAction<BridgeUserAction.UPDATE_QUOTE_PARAMS>;

type BridgeControllerEvents = ControllerStateChangeEvent<
  typeof BRIDGE_CONTROLLER_NAME,
  BridgeControllerState
>;

type AllowedActions =
  | AccountsControllerGetSelectedAccountAction['type']
  | NetworkControllerGetSelectedNetworkClientAction['type']
  | NetworkControllerFindNetworkClientIdByChainIdAction['type'];
type AllowedEvents = never;

/**
 * The messenger for the BridgeController.
 */
export type BridgeControllerMessenger = RestrictedControllerMessenger<
  typeof BRIDGE_CONTROLLER_NAME,
  | BridgeControllerActions
  | AccountsControllerGetSelectedAccountAction
  | NetworkControllerGetSelectedNetworkClientAction
  | NetworkControllerFindNetworkClientIdByChainIdAction,
  BridgeControllerEvents,
  AllowedActions,
  AllowedEvents
>;
