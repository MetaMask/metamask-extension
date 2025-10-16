import { Messenger } from '@metamask/base-controller';
import {
  type NetworkControllerGetEIP1559CompatibilityAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
  type NetworkControllerGetStateAction,
  NetworkControllerNetworkDidChangeEvent,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';

type AllowedActions =
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetEIP1559CompatibilityAction;

type AllowedEvents = NetworkControllerStateChangeEvent;

export type GasFeeControllerMessenger = ReturnType<
  typeof getGasFeeControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * gas fee controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getGasFeeControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'GasFeeController',
    allowedActions: [
      'NetworkController:getEIP1559Compatibility',
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
    ],
    allowedEvents: ['NetworkController:stateChange'],
  });
}

type AllowedInitializationActions =
  | NetworkControllerGetEIP1559CompatibilityAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetSelectedNetworkClientAction
  | NetworkControllerGetStateAction;

type AllowedInitializationEvents = NetworkControllerNetworkDidChangeEvent;

export type GasFeeControllerInitMessenger = ReturnType<
  typeof getGasFeeControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the currency rate controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getGasFeeControllerInitMessenger(
  messenger: Messenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  return messenger.getRestricted({
    name: 'GasFeeControllerInit',
    allowedActions: [
      'NetworkController:getEIP1559Compatibility',
      'NetworkController:getNetworkClientById',
      'NetworkController:getSelectedNetworkClient',
      'NetworkController:getState',
    ],
    allowedEvents: ['NetworkController:networkDidChange'],
  });
}
