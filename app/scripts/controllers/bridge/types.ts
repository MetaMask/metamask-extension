import {
  ControllerStateChangeEvent,
  RestrictedMessenger,
} from '@metamask/base-controller';
import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
} from '@metamask/network-controller';
import type {
  BridgeBackgroundAction,
  BridgeControllerState,
  BridgeUserAction,
} from '../../../../shared/types/bridge';
import BridgeController from './bridge-controller';
import { BRIDGE_CONTROLLER_NAME } from './constants';

type BridgeControllerAction<FunctionName extends keyof BridgeController> = {
  type: `${typeof BRIDGE_CONTROLLER_NAME}:${FunctionName}`;
  handler: BridgeController[FunctionName];
};

// Maps to BridgeController function names
type BridgeControllerActions =
  | BridgeControllerAction<BridgeBackgroundAction.SET_FEATURE_FLAGS>
  | BridgeControllerAction<BridgeBackgroundAction.RESET_STATE>
  | BridgeControllerAction<BridgeBackgroundAction.GET_BRIDGE_ERC20_ALLOWANCE>
  | BridgeControllerAction<BridgeUserAction.UPDATE_QUOTE_PARAMS>;

type BridgeControllerEvents = ControllerStateChangeEvent<
  typeof BRIDGE_CONTROLLER_NAME,
  BridgeControllerState
>;

type AllowedActions =
  | AccountsControllerGetSelectedAccountAction
  | NetworkControllerGetSelectedNetworkClientAction
  | NetworkControllerFindNetworkClientIdByChainIdAction;
type AllowedEvents = never;

/**
 * The messenger for the BridgeController.
 */
export type BridgeControllerMessenger = RestrictedMessenger<
  typeof BRIDGE_CONTROLLER_NAME,
  BridgeControllerActions | AllowedActions,
  BridgeControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;
