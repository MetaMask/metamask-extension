import { Messenger } from '@metamask/base-controller';
import { AllowedActions } from '@metamask/ens-controller';
import { NetworkControllerNetworkDidChangeEvent } from '@metamask/network-controller';

export type EnsControllerMessenger = ReturnType<
  typeof getEnsControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the ENS
 * controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getEnsControllerMessenger(
  messenger: Messenger<AllowedActions, never>,
) {
  return messenger.getRestricted({
    name: 'EnsController',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
    ],
    allowedEvents: [],
  });
}

type AllowedInitializationEvents = NetworkControllerNetworkDidChangeEvent;

export type EnsControllerInitMessenger = ReturnType<
  typeof getEnsControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed during
 * initialization of the ENS controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getEnsControllerInitMessenger(
  messenger: Messenger<never, AllowedInitializationEvents>,
) {
  return messenger.getRestricted({
    name: 'EnsControllerInit',
    allowedActions: [],
    allowedEvents: ['NetworkController:networkDidChange'],
  });
}
