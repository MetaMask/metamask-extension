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
  networkId: NetworkId | null;
};

export type NetworksOrderingControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  never,
  never,
  never,
  never
>;

const defaultState = {
  networksList: {},
};

const metadata = {
  networkId: {
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
    const mergedState = { ...defaultState, ...state };
    super({ messenger, metadata, name: controllerName, state: mergedState });
    this.#onUpdateNetworksList(allAnnouncements);
  }

  /**
   * Compares the announcements in state with the announcements from file
   * to check if there are any new announcements
   * if yes, the new announcement will be added to the state with a flag indicating
   * that the announcement is not seen by the user.
   *
   * @param allAnnouncements - all announcements to compare with the announcements from state
   */
  #addAnnouncements(allAnnouncements: AnnouncementMap): void {
    this.update((state) => {
      Object.values(allAnnouncements).forEach((announcement: Announcement) => {
        state.announcements[announcement.id] = state.announcements[
          announcement.id
        ] ?? { ...announcement, isShown: false };
      });
    });
  }
}
