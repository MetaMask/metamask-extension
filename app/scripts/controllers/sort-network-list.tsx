import {
  BaseControllerV2,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';

const controllerName = 'NetworksOrderingController';

/**
 * The network ID of a network.
 */
export type NetworkId = `${number}`;

export type NetworksOrderingControllerState = {
  networksList: NetworkId[] | null;
};

export type NetworksOrderingControllerUpdateNetworkListAction = {
  type: `${typeof controllerName}:updateNetworkList`;
  handler: NetworksOrderingController['updateNetowrksList'];
};

export type NetworksOrderingControllerMessengerActions =
  NetworksOrderingControllerUpdateNetworkListAction;

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
   */
  constructor({
    messenger,
    state,
  }: {
    messenger: NetworksOrderingControllerMessenger;
    state?: NetworksOrderingControllerState;
  }) {
    super({
      messenger,
      metadata,
      name: controllerName,
      state: { ...defaultState, ...state },
    });
  }

  updateNetowrksList(networksList: NetworkId[]) {
    this.update((state) => {
      state.networksList = networksList;
      return state;
    });
  }
}
