import {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedMessenger,
} from '@metamask/base-controller';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import { AccountsControllerGetSelectedMultichainAccountAction } from '@metamask/accounts-controller';
import { TransactionControllerGetStateAction } from '@metamask/transaction-controller';
import {
  BridgeHistoryItem,
  BridgeStatusAction,
  BridgeStatusControllerState,
  BridgeStatusController,
} from '@metamask/bridge-status-controller';
import { BRIDGE_STATUS_CONTROLLER_NAME } from './constants';

// Actions
type BridgeStatusControllerAction<
  FunctionName extends keyof BridgeStatusController,
> = {
  type: `${typeof BRIDGE_STATUS_CONTROLLER_NAME}:${FunctionName}`;
  handler: BridgeStatusController[FunctionName];
};

// Maps to BridgeController function names
type BridgeStatusControllerActions =
  | BridgeStatusControllerAction<BridgeStatusAction.START_POLLING_FOR_BRIDGE_TX_STATUS>
  | BridgeStatusControllerAction<BridgeStatusAction.WIPE_BRIDGE_STATUS>
  | ControllerGetStateAction<
      typeof BRIDGE_STATUS_CONTROLLER_NAME,
      BridgeStatusControllerState
    >;

// Events
export type BridgeStatusControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof BRIDGE_STATUS_CONTROLLER_NAME,
  BridgeStatusControllerState
>;

export type BridgeStatusControllerBridgeTransactionCompleteEvent = {
  type: `${typeof BRIDGE_STATUS_CONTROLLER_NAME}:bridgeTransactionComplete`;
  payload: [{ bridgeHistoryItem: BridgeHistoryItem }];
};

export type BridgeStatusControllerBridgeTransactionFailedEvent = {
  type: `${typeof BRIDGE_STATUS_CONTROLLER_NAME}:bridgeTransactionFailed`;
  payload: [{ bridgeHistoryItem: BridgeHistoryItem }];
};

type BridgeStatusControllerEvents =
  | BridgeStatusControllerStateChangeEvent
  | BridgeStatusControllerBridgeTransactionCompleteEvent
  | BridgeStatusControllerBridgeTransactionFailedEvent;

/**
 * The external actions available to the BridgeStatusController.
 */
type AllowedActions =
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | AccountsControllerGetSelectedMultichainAccountAction
  | TransactionControllerGetStateAction;

/**
 * The external events available to the BridgeStatusController.
 */
type AllowedEvents = never;

/**
 * The messenger for the BridgeStatusController.
 */
export type BridgeStatusControllerMessenger = RestrictedMessenger<
  typeof BRIDGE_STATUS_CONTROLLER_NAME,
  BridgeStatusControllerActions | AllowedActions,
  BridgeStatusControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;
