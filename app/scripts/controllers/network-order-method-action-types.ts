/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { NetworkOrderController } from './network-order';

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
  NetworkOrderControllerUpdateNetworksListAction;
