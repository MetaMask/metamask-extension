import {
  Messenger,
  MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { EnsControllerMessenger } from '@metamask/ens-controller';
import { NetworkControllerNetworkDidChangeEvent } from '@metamask/network-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the ENS
 * controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getEnsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<EnsControllerMessenger>,
    MessengerEvents<EnsControllerMessenger>
  >,
) {
  const controllerMessenger: EnsControllerMessenger = new Messenger({
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
