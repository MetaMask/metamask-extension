import {
  BaseController,
  RestrictedControllerMessenger,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
} from '@metamask/base-controller';
import { FeatureAnnouncementsService } from './services/feature-announcements';
import type { Notification } from './types/notification';

// Unique name for the controller
const controllerName = 'PlatformNotificationsController';

/**
 * State shape for PlatformNotificationsController
 */
export type PlatformNotificationsControllerState = {
  /**
   * List of platform notifications
   */
  platformNotificationsList: Notification[];

  /**
   * List of read platform notifications
   */
  platformNotificationsReadList: string[];

  /**
   * Loading state for platform notifications
   */
  platformNotificationsIsLoading: boolean;
};

// Describes the action for updating the accounts list
export type PlatformNotificationsControllerUpdateNotificationsListAction = {
  type: `${typeof controllerName}:updatePlatformNotificationsList`;
  handler: PlatformNotificationsController['updatePlatformNotificationsList'];
};

// Describes the action for updating the loading state
export type PlatformNotificationsControllerUpdateLoadingStateAction = {
  type: `${typeof controllerName}:updatePlatformNotificationsIsLoadingState`;
  handler: (isLoading: boolean) => void;
};

// Union of all possible actions for the messenger
// Union of all possible actions for the messenger
export type PlatformNotificationsControllerMessengerActions =
  | PlatformNotificationsControllerUpdateNotificationsListAction
  | PlatformNotificationsControllerUpdateLoadingStateAction
  | ControllerGetStateAction<'state', PlatformNotificationsControllerState>;

// Union of all possible events for the messenger
export type PlatformNotificationsControllerMessengerEvents =
  ControllerStateChangeEvent<
    typeof controllerName,
    PlatformNotificationsControllerState
  >;

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
  private featureAnnouncementsService: FeatureAnnouncementsService;

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

    this.featureAnnouncementsService = new FeatureAnnouncementsService();
  }

  /**
   * Updates the loading state in the state with the provided value.
   *
   * @param isLoading - The loading state to update in the state.
   */
  private updatePlatformNotificationsIsLoadingState(isLoading: boolean) {
    this.update((state) => {
      state.platformNotificationsIsLoading = isLoading;
      return state;
    });
  }

  /**
   * Updates the accounts list in the state with the provided list of accounts.
   *
   * @param platformNotificationsList - The list of the notifications to update in the state.
   */
  private updatePlatformNotificationsList(
    platformNotificationsList: Notification[],
  ) {
    this.update((state) => {
      state.platformNotificationsList = platformNotificationsList;
      return state;
    });
  }

  /**
   * Fetches the notifications and updates the notifications list in the state.
   */
  async fetchAndUpdatePlatformNotifications() {
    this.updatePlatformNotificationsIsLoadingState(true);

    const { platformNotificationsReadList } = this.state;
    const platformNotifications =
      await this.featureAnnouncementsService.getFeatureAnnouncementNotifications(
        platformNotificationsReadList,
      );
    this.updatePlatformNotificationsList(platformNotifications);

    this.updatePlatformNotificationsIsLoadingState(false);
  }

  /**
   * Updates the platform notifications list in the state with the provided list of accounts.
   *
   * @param ids - The list of the notification ids to update in the state.
   */
  markPlatformNotificationsAsRead(ids: string[]) {
    this.update((state) => {
      state.platformNotificationsReadList = [
        ...state.platformNotificationsReadList,
        ...ids,
      ];
      return state;
    });
  }
}
