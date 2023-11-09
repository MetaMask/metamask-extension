import {
  BaseControllerV2,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import {
  NetworkControllerStateChangeEvent,
  NetworkState,
} from '@metamask/network-controller';
import type { Patch } from 'immer';
import { MAINNET_CHAINS } from '../../../shared/constants/network';

// Unique name for the controller
const controllerName = 'NetworksOrderController';

/**
 * The network ID of a network.
 */
export type NetworkId = string;

// State shape for NetworksOrderController
export type NetworksOrderControllerState = {
  networksList: NetworkId[]; // Remove the union with null
};

// Describes the structure of a state change event
export type NetworksOrderStateChange = {
  type: `${typeof controllerName}:stateChange`;
  payload: [NetworksOrderControllerState, Patch[]];
};

// Describes the action for updating the networks list
export type NetworksOrderControllerupdateNetworksListAction = {
  type: `${typeof controllerName}:updateNetworksList`;
  handler: NetworksOrderController['updateNetworksList'];
};

// Union of all possible actions for the messenger
export type NetworksOrderControllerMessengerActions =
  NetworksOrderControllerupdateNetworksListAction;

// Type for the messenger of NetworksOrderController
export type NetworksOrderControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  NetworksOrderControllerMessengerActions,
  NetworksOrderStateChange | NetworkControllerStateChangeEvent,
  never,
  NetworksOrderStateChange['type'] | NetworkControllerStateChangeEvent['type']
>;

// Default state for the controller
const defaultState = {
  networksList: [],
};

// Metadata for the controller state
const metadata = {
  networksList: {
    persist: true,
    anonymous: true,
  },
};

/**
 * Controller that updates the order of the network list.
 * This controller subscribes to network state changes and ensures
 * that the network list is updated based on the latest network configurations.
 */
export class NetworksOrderController extends BaseControllerV2<
  typeof controllerName,
  NetworksOrderControllerState,
  NetworksOrderControllerMessenger
> {
  /**
   * Creates a NetworksOrderController instance.
   *
   * @param args - The arguments to this function.
   * @param args.messenger - Messenger used to communicate with BaseV2 controller.
   * @param args.state - Initial state to set on this controller.
   */
  constructor({
    messenger,
    state,
  }: {
    messenger: NetworksOrderControllerMessenger;
    state?: NetworksOrderControllerState;
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
      async (networkControllerState) => {
        await this.onNetworkControllerStateChange(networkControllerState);
      },
    );
  }

  // Callback for handling network state changes
  onNetworkControllerStateChange(networkControllerState: NetworkState) {
    // Extract network configurations from the state
    const networkConfigurations = Object.values(
      networkControllerState.networkConfigurations,
    );

    // Since networkConfigurations doesn't have default or mainnet network configurations we need to combine mainnet chains with network configurations
    const combinedNetworks = [...MAINNET_CHAINS, ...networkConfigurations];

    // Extract unique chainIds from the combined networks
    const uniqueChainIds = combinedNetworks.map((item) => item.chainId);

    // Update the state with the new networks list
    this.update((state) => {
      // Combine existing networks with unique chainIds, excluding duplicates
      const updatedNetworksList = [
        ...state.networksList,
        ...uniqueChainIds.filter((id) => !state.networksList.includes(id)),
      ];

      // Return the updated state
      return { ...state, networksList: updatedNetworksList };
    });
  }

  // Action for updating the networks list
  updateNetworksList(networkList: []) {
    this.update((state) => {
      state.networksList = networkList;
      return state;
    });
  }
}
