import {
  BaseControllerV2,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { NetworkState } from '@metamask/network-controller';

const controllerName = 'NetworksOrderingController';

/**
 * The network ID of a network.
 */
export type NetworkId = string;

export type NetworksOrderingControllerState = {
  networksList: NetworkId[] | null;
};

export type NetworksOrderingControllerupdateNetworksListAction = {
  type: `${typeof controllerName}:updateNetworksList`;
  handler: NetworksOrderingController['updateNetworksList'];
};

export type NetworksOrderingControllerMessengerActions =
  NetworksOrderingControllerupdateNetworksListAction;

export type NetworksOrderingControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  NetworksOrderingControllerMessengerActions,
  never,
  never,
  never
>;

const defaultState = {
  networksList: [],
};

const metadata = {
  networksList: {
    persist: true,
    anonymous: true,
  },
};

export class NetworksOrderingController extends BaseControllerV2<
  typeof controllerName,
  NetworksOrderingControllerState,
  NetworksOrderingControllerMessenger
> {
  /**
   * Creates a NetworksOrderingController instance.
   *
   * @param args - The arguments to this function.
   * @param args.messenger - Messenger used to communicate with BaseV2 controller.
   * @param args.state - Initial state to set on this controller.
   * @param args.onNetworkStateChange - Allows subscribing to network controller state changes.
   */
  constructor({
    messenger,
    state,
    onNetworkStateChange,
  }: {
    messenger: NetworksOrderingControllerMessenger;
    state?: NetworksOrderingControllerState;
    onNetworkStateChange: (listener: (state: NetworkState) => void) => void;
  }) {
    super({
      messenger,
      metadata,
      name: controllerName,
      state: { ...defaultState, ...state },
    });

    if (onNetworkStateChange) {
      console.log('test1');
      onNetworkStateChange(async (networkControllerState) => {
        await this.onNetworkControllerStateChange(networkControllerState);
      });
    } else {
      console.log('test2');
      this.messagingSystem.subscribe(
        'NetworkController:stateChange',
        async (networkControllerState) => {
          await this.onNetworkControllerStateChange(networkControllerState);
        },
      );
    }
  }

  onNetworkControllerStateChange(networkControllerState: NetworkState) {
    console.log(networkControllerState, "networkControllerState")
  }

  updateNetworksList(networkList: []) {
    this.update((state) => {
      state.networksList = networkList;
      return state;
    });
  }
}
