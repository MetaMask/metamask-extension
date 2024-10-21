import {
  BaseController,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import {
  NetworkControllerStateChangeEvent,
  NetworkState,
} from '@metamask/network-controller';
import { Hex } from '@metamask/utils';
import type { Patch } from 'immer';
import { TEST_CHAINS } from '../../../shared/constants/network';

// Unique name for the controller
const controllerName = 'NetworkOrderController';

/**
 * Information about an ordered network.
 */
export type NetworksInfo = {
  networkId: Hex; // The network's chain id
};

// State shape for NetworkOrderController
export type NetworkOrderControllerState = {
  orderedNetworkList: NetworksInfo[];
};

// Describes the structure of a state change event
export type NetworkOrderStateChange = {
  type: `${typeof controllerName}:stateChange`;
  payload: [NetworkOrderControllerState, Patch[]];
};

// Describes the action for updating the networks list
export type NetworkOrderControllerupdateNetworksListAction = {
  type: `${typeof controllerName}:updateNetworksList`;
  handler: NetworkOrderController['updateNetworksList'];
};

// Union of all possible actions for the messenger
export type NetworkOrderControllerMessengerActions =
  NetworkOrderControllerupdateNetworksListAction;

// Type for the messenger of NetworkOrderController
export type NetworkOrderControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  NetworkOrderControllerMessengerActions,
  NetworkOrderStateChange | NetworkControllerStateChangeEvent,
  never,
  NetworkOrderStateChange['type'] | NetworkControllerStateChangeEvent['type']
>;

// Default state for the controller
const defaultState: NetworkOrderControllerState = {
  orderedNetworkList: [],
};

// Metadata for the controller state
const metadata = {
  orderedNetworkList: {
    persist: true,
    anonymous: true,
  },
};

/**
 * Controller that updates the order of the network list.
 * This controller subscribes to network state changes and ensures
 * that the network list is updated based on the latest network configurations.
 */
export class NetworkOrderController extends BaseController<
  typeof controllerName,
  NetworkOrderControllerState,
  NetworkOrderControllerMessenger
> {
  /**
   * Creates a NetworkOrderController instance.
   *
   * @param args - The arguments to this function.
   * @param args.messenger - Messenger used to communicate with BaseV2 controller.
   * @param args.state - Initial state to set on this controller.
   */
  constructor({
    messenger,
    state,
  }: {
    messenger: NetworkOrderControllerMessenger;
    state?: NetworkOrderControllerState;
  }) {
    // Call the constructor of BaseControllerV2
    super({
      messenger,
      metadata,
      name: controllerName,
      state: { ...defaultState, ...state },
    });

    // Subscribe to network state changes
    this.messagingSystem.subscribe(
      'NetworkController:stateChange',
      (networkControllerState) => {
        this.onNetworkControllerStateChange(networkControllerState);
      },
    );
  }

  /**
   * Handles the state change of the network controller and updates the networks list.
   *
   * @param networkControllerState - The state of the network controller.
   * @param networkControllerState.networkConfigurationsByChainId
   */
  onNetworkControllerStateChange({
    networkConfigurationsByChainId,
  }: NetworkState) {
    this.update((state) => {
      // Filter out testnets, which are in the state but not orderable
      const chainIds = Object.keys(networkConfigurationsByChainId).filter(
        (chainId) =>
          !TEST_CHAINS.includes(chainId as (typeof TEST_CHAINS)[number]),
      ) as Hex[];

      const newNetworks = chainIds
        .filter(
          (chainId) =>
            !state.orderedNetworkList.some(
              ({ networkId }) => networkId === chainId,
            ),
        )
        .map((chainId) => ({ networkId: chainId }));

      state.orderedNetworkList = state.orderedNetworkList
        // Filter out deleted networks
        .filter(({ networkId }) => chainIds.includes(networkId))
        // Append new networks to the end
        .concat(newNetworks);
    });
  }

  /**
   * Updates the networks list in the state with the provided list of networks.
   *
   * @param networkList - The list of networks to update in the state.
   */

  updateNetworksList(chainIds: Hex[]) {
    this.update((state) => {
      state.orderedNetworkList = chainIds.map((chainId) => ({
        networkId: chainId,
      }));
    });
  }
}
