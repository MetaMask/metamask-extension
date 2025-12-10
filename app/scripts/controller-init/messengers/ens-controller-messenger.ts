import { Messenger } from '@metamask/messenger';
import { AllowedActions } from '@metamask/ens-controller';
import { NetworkControllerNetworkDidChangeEvent } from '@metamask/network-controller';
import { RootMessenger } from '../../lib/messenger';

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
  messenger: RootMessenger<AllowedActions, never>,
) {
  const controllerMessenger = new Messenger<
    'EnsController',
    AllowedActions,
    never,
    typeof messenger
  >({
    namespace: 'EnsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
    ],
  });
  return controllerMessenger;
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
  messenger: RootMessenger<never, AllowedInitializationEvents>,
) {
  const controllerInitMessenger = new Messenger<
    'EnsControllerInit',
    never,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'EnsControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    events: ['NetworkController:networkDidChange'],
  });
  return controllerInitMessenger;
}
