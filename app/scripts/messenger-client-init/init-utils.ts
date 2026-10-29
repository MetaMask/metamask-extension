import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';

/**
 * Get the global chain ID from the network controller's state.
 *
 * This is extracted from the `MetaMaskController` to be reused in controller
 * initialization functions.
 *
 * @param initMessenger - The messenger to use to call the network controller.
 * This messenger must be permitted to call `NetworkController:getState` and
 * `NetworkController:getNetworkClientById`.
 * @returns The global chain ID.
 * @deprecated Avoid using this function in new code. Instead, call the network
 * controller directly from within your controller.
 */
export function getGlobalChainId(
  initMessenger: Messenger<
    string,
    | NetworkControllerGetStateAction
    | NetworkControllerGetNetworkClientByIdAction
  >,
) {
  const networkState = initMessenger.call('NetworkController:getState');
  const networkClientId = networkState.selectedNetworkClientId;

  const { chainId } = initMessenger.call(
    'NetworkController:getNetworkClientById',
    networkClientId,
  ).configuration;

  return chainId;
}
