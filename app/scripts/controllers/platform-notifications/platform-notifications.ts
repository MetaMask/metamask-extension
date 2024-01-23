import {
  BaseController,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { getFeatureAnnouncementNotifications } from './services/feature-announcements';
import type { Notification } from './types/notification';

// Unique name for the controller
const controllerName = 'PlatformNotificationsController';

// State shape for PlatformNotificationsController
export type PlatformNotificationsControllerState = {
  platformNotificationsList: Notification[];
  platformNotificationsReadList: string[];
  platformNotificationsIsLoading: boolean;
};

// Describes the action for updating the accounts list
export type PlatformNotificationsControllerupdateNotificationsListAction = {
  type: `${typeof controllerName}:updatePlatformNotificationsList`;
  handler: PlatformNotificationsController['updatePlatformNotificationsList'];
};

// Describes the action for updating the loading state
export type PlatformNotificationsControllerUpdateLoadingStateAction = {
  type: `${typeof controllerName}:updatePlatformNotificationsIsLoadingState`;
  handler: (isLoading: boolean) => void;
};

// Union of all possible actions for the messenger
export type PlatformNotificationsControllerMessengerActions =
  | PlatformNotificationsControllerupdateNotificationsListAction
  | PlatformNotificationsControllerUpdateLoadingStateAction;

// Type for the messenger of PlatformNotificationsController
export type PlatformNotificationsControllerMessenger =
  RestrictedControllerMessenger<
    typeof controllerName,
    PlatformNotificationsControllerMessengerActions,
    never,
    never,
    never
  >;

// Metadata for the controller state
const metadata = {
  platformNotificationsList: {
    persist: true,
    anonymous: true,
  },
  platformNotificationsReadList: {
    persist: true,
    anonymous: true,
  },
  platformNotificationsIsLoading: {
    persist: false,
    anonymous: true,
  },
};

/**
 * Controller that updates the PlatformNotifications and the ReadPlatformNotifications list.
 * This controller subscribes to account state changes and ensures
 * that the account list is updated based on the latest account configurations.
 */
export class PlatformNotificationsController extends BaseController<
  typeof controllerName,
  PlatformNotificationsControllerState,
  PlatformNotificationsControllerMessenger
> {
  /**
   * Creates a PlatformNotificationsController instance.
   *
   * @param args - The arguments to this function.
   * @param args.messenger - Messenger used to communicate with BaseV2 controller.
   * @param args.state - Initial state to set on this controller.
   */
  constructor({
    messenger,
    state,
  }: {
    messenger: PlatformNotificationsControllerMessenger;
    state?: PlatformNotificationsControllerState;
  }) {
    const platformNotificationsList = state?.platformNotificationsList || [];
    const platformNotificationsReadList =
      state?.platformNotificationsReadList || [];
    const platformNotificationsIsLoading =
      state?.platformNotificationsIsLoading || false;

    // Call the constructor of BaseControllerV2
    super({
      messenger,
      metadata,
      name: controllerName,
      state: {
        platformNotificationsIsLoading,
        platformNotificationsList,
        platformNotificationsReadList,
      },
    });
  }

  /**
   * Updates the loading state in the state with the provided value.
   *
   * @param isLoading - The loading state to update in the state.
   */
  updatePlatformNotificationsIsLoadingState(isLoading: boolean) {
    this.update((state) => {
      state.platformNotificationsIsLoading = isLoading;
      return state;
    });
  }

  /**
   * Fetches the notifications and updates the notifications list in the state.
   */
  async fetchAndUpdatePlatformNotifications() {
    this.updatePlatformNotificationsIsLoadingState(true);

    const platformNotificationsReadList =
      this.getReadPlatformNotificationsList();
    const platformNotifications = await getFeatureAnnouncementNotifications(
      platformNotificationsReadList,
    );
    this.updatePlatformNotificationsList(platformNotifications);

    this.updatePlatformNotificationsIsLoadingState(false);
  }

  /**
   * Retrieves the list of read platform notifications.
   * This method returns the current state of read platform notifications.
   */
  getReadPlatformNotificationsList() {
    return this.state.platformNotificationsReadList;
  }

  /**
   * Updates the accounts list in the state with the provided list of accounts.
   *
   * @param platformNotificationsList - The list of the notifications to update in the state.
   */
  updatePlatformNotificationsList(platformNotificationsList: Notification[]) {
    this.update((state) => {
      state.platformNotificationsList = platformNotificationsList;
      return state;
    });
  }

  /**
   * Updates the platform notifications list in the state with the provided list of accounts.
   *
   * @param platformNotificationsReadList - The list of the notifications to update in the state.
   */
  updatePlatformNotificationsReadList(platformNotificationsReadList: string[]) {
    this.update((state) => {
      state.platformNotificationsReadList = platformNotificationsReadList;
      return state;
    });
  }
}
