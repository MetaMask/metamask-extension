import { Messenger } from '@metamask/messenger';
import {
  type NetworkControllerGetEIP1559CompatibilityAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
  type NetworkControllerGetStateAction,
  NetworkControllerNetworkDidChangeEvent,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import { RootMessenger } from '../../lib/messenger';

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
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const controllerMessenger = new Messenger<
    'GasFeeController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'GasFeeController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:getEIP1559Compatibility',
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
    ],
    events: ['NetworkController:stateChange'],
  });
  return controllerMessenger;
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
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'GasFeeControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'GasFeeControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'NetworkController:getEIP1559Compatibility',
      'NetworkController:getNetworkClientById',
      'NetworkController:getSelectedNetworkClient',
      'NetworkController:getState',
    ],
    events: ['NetworkController:networkDidChange'],
  });
  return controllerInitMessenger;
}
