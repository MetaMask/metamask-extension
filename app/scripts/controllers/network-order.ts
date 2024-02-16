import {
  BaseController,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import {
  NetworkControllerStateChangeEvent,
  NetworkState,
} from '@metamask/network-controller';
import type { Patch } from 'immer';
import { MAINNET_CHAINS } from '../../../shared/constants/network';

// Unique name for the controller
const controllerName = 'NetworkOrderController';

/**
 * The network ID of a network.
 */

export type NetworksInfo = {
  networkId: string;
  networkRpcUrl: string;
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
   */
  onNetworkControllerStateChange(networkControllerState: NetworkState) {
    // Extract network configurations from the state
    const networkConfigurations = Object.values(
      networkControllerState.networkConfigurations,
    );

    // Since networkConfigurations doesn't have default or mainnet network configurations we need to combine mainnet chains with network configurations
    const combinedNetworks = [...MAINNET_CHAINS, ...networkConfigurations];

    // Extract unique chainIds from the combined networks
    const uniqueChainIds = combinedNetworks.map((item) => ({
      networkId: item.chainId,
      networkRpcUrl: item.rpcUrl,
    }));

    // Arrays to store reordered and new unique chainIds
    let reorderedNetworks: NetworksInfo[] = [];
    const newUniqueNetworks: NetworksInfo[] = [];

    // Iterate through uniqueChainIds to reorder existing elements
    uniqueChainIds.forEach((newItem) => {
      const existingIndex = this.state.orderedNetworkList.findIndex(
        (item) =>
          item.networkId === newItem.networkId &&
          item.networkRpcUrl === newItem.networkRpcUrl,
      );
      // eslint-disable-next-line no-negated-condition
      if (existingIndex !== -1) {
        // Reorder existing element
        reorderedNetworks[existingIndex] = newItem;
      } else {
        // Add new unique element
        newUniqueNetworks.push(newItem);
      }
    });

    // Filter out null values and concatenate reordered and new unique networks
    reorderedNetworks = reorderedNetworks
      .filter((item) => Boolean(item))
      .concat(newUniqueNetworks);

    // Update the state with the new networks list
    this.update((state) => {
      state.orderedNetworkList = reorderedNetworks;
    });
  }

  /**
   * Updates the networks list in the state with the provided list of networks.
   *
   * @param networkList - The list of networks to update in the state.
   */

  updateNetworksList(networkList: []) {
    this.update((state) => {
      state.orderedNetworkList = networkList;
      return state;
    });
  }
}
