/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { NetworkOrderController } from './network-order';

/**
 * Handles the state change of the network controller and updates the networks list.
 *
 * @param networkControllerState - The state of the network controller.
 * @param networkControllerState.networkConfigurationsByChainId
 */
export type NetworkOrderControllerOnNetworkControllerStateChangeAction = {
  type: `NetworkOrderController:onNetworkControllerStateChange`;
  handler: NetworkOrderController['onNetworkControllerStateChange'];
};

/**
 * Updates the networks list in the state with the provided list of networks.
 *
 * @param networkList - The list of networks to update in the state.
 */
export type NetworkOrderControllerUpdateNetworksListAction = {
  type: `NetworkOrderController:updateNetworksList`;
  handler: NetworkOrderController['updateNetworksList'];
};

/**
 * Union of all NetworkOrderController action types.
 */
export type NetworkOrderControllerMethodActions =
  | NetworkOrderControllerOnNetworkControllerStateChangeAction
  | NetworkOrderControllerUpdateNetworksListAction;
