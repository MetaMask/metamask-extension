import type { Hex } from '@metamask/utils';

/**
 * Describes the shape of the state object for a theoretical NetworkController.
 *
 * Note that this package does not supply a NetworkController; this type is only
 * here so it is possible to write a complete example.
 */
type NetworkControllerState = {
  networkName: string;
  chainId: Hex;
};

/**
 * Constructs a default representation of a theoretical NetworkController's
 * state.
 *
 * Note that this package does not supply a NetworkController; this type is only
 * here so it is possible to write a complete example.
 *
 * @returns The default network controller state.
 */
export function getDefaultNetworkControllerState(): NetworkControllerState {
  return {
    networkName: 'Some Network',
    chainId: '0x1',
  };
}

/**
 * The action which can be used to obtain the state for a theoretical
 * NetworkController.
 *
 * Note that this package does not supply a NetworkController; this type is only
 * here so it is possible to write a complete example.
 */
export type NetworkControllerGetStateAction = {
  type: 'NetworkController:getState';
  handler: () => NetworkControllerState;
};
