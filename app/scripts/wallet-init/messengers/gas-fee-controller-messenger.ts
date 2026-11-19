import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import { RootMessenger } from '../../lib/messenger';

export type GasFeeControllerInitMessengerActions =
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction;

export type GasFeeControllerInitMessenger = ReturnType<
  typeof getGasFeeControllerInitMessenger
>;

/**
 * Create a messenger restricted to the actions the extension-side gas fee
 * instance options need. The wallet-owned `GasFeeController` builds its own
 * provider and network callbacks from `NetworkController`; the extension only
 * reads the global chain ID to decide legacy gas API compatibility.
 *
 * @param messenger - The root messenger used to create the restricted messenger.
 * @returns The restricted gas fee init messenger.
 */
export function getGasFeeControllerInitMessenger(
  messenger: RootMessenger<GasFeeControllerInitMessengerActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'GasFeeControllerInit',
    GasFeeControllerInitMessengerActions,
    never,
    typeof messenger
  >({
    namespace: 'GasFeeControllerInit',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
    ],
  });

  return controllerInitMessenger;
}
