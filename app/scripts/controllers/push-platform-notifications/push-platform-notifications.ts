import {
  BaseController,
  RestrictedControllerMessenger,
  ControllerGetStateAction,
} from '@metamask/base-controller';
import { AuthenticationController } from '@metamask/profile-sync-controller';

import log from 'loglevel';

import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
import type { Notification } from '../metamask-notifications/types/notification/notification';
import {
  activatePushNotifications,
  deactivatePushNotifications,
  listenToPushNotifications,
  updateTriggerPushNotifications,
} from './services/services';

const controllerName = 'PushPlatformNotificationsController';

export type PushPlatformNotificationsControllerState = {
  fcmToken: string;
};

export declare type PushPlatformNotificationsControllerEnablePushNotifications =
  {
    type: `${typeof controllerName}:enablePushNotifications`;
    handler: PushPlatformNotificationsController['enablePushNotifications'];
  };

export declare type PushPlatformNotificationsControllerDisablePushNotifications =
  {
    type: `${typeof controllerName}:disablePushNotifications`;
    handler: PushPlatformNotificationsController['disablePushNotifications'];
  };
export declare type PushPlatformNotificationsControllerUpdateTriggerPushNotifications =
  {
    type: `${typeof controllerName}:updateTriggerPushNotifications`;
    handler: PushPlatformNotificationsController['updateTriggerPushNotifications'];
  };

export type PushPlatformNotificationsControllerMessengerActions =
  | PushPlatformNotificationsControllerEnablePushNotifications
  | PushPlatformNotificationsControllerDisablePushNotifications
  | PushPlatformNotificationsControllerUpdateTriggerPushNotifications
  | ControllerGetStateAction<'state', PushPlatformNotificationsControllerState>;

type AllowedActions =
  AuthenticationController.AuthenticationControllerGetBearerToken;

export type PushPlatformNotificationsControllerOnNewNotificationEvent = {
  type: `${typeof controllerName}:onNewNotifications`;
  payload: [Notification];
};

export type PushPlatformNotificationsControllerPushNotificationClicked = {
  type: `${typeof controllerName}:pushNotificationClicked`;
  payload: [Notification];
};

type AllowedEvents =
  | PushPlatformNotificationsControllerOnNewNotificationEvent
  | PushPlatformNotificationsControllerPushNotificationClicked;

export type PushPlatformNotificationsControllerMessenger =
  RestrictedControllerMessenger<
    typeof controllerName,
    PushPlatformNotificationsControllerMessengerActions | AllowedActions,
    AllowedEvents,
    AllowedActions['type'],
    AllowedEvents['type']
  >;

const metadata = {
  fcmToken: {
    persist: true,
    anonymous: true,
  },
};

/**
 * Manages push notifications for the application, including enabling, disabling, and updating triggers for push notifications.
 * This controller integrates with Firebase Cloud Messaging (FCM) to handle the registration and management of push notifications.
 * It is responsible for registering and unregistering the service worker that listens for push notifications,
 * managing the FCM token, and communicating with the server to register or unregister the device for push notifications.
 * Additionally, it provides functionality to update the server with new UUIDs that should trigger push notifications.
 *
 * @augments {BaseController<typeof controllerName, PushPlatformNotificationsControllerState, PushPlatformNotificationsControllerMessenger>}
 */
export class PushPlatformNotificationsController extends BaseController<
  typeof controllerName,
  PushPlatformNotificationsControllerState,
  PushPlatformNotificationsControllerMessenger
> {
  #pushListenerUnsubscribe: (() => void) | undefined = undefined;

  constructor({
    messenger,
    state,
  }: {
    messenger: PushPlatformNotificationsControllerMessenger;
    state: PushPlatformNotificationsControllerState;
  }) {
    super({
      messenger,
      metadata,
      name: controllerName,
      state: {
        fcmToken: state?.fcmToken || '',
      },
    });

    this.#registerMessageHandlers();
  }

  #registerMessageHandlers(): void {
    this.messagingSystem.registerActionHandler(
      'PushPlatformNotificationsController:enablePushNotifications',
      this.enablePushNotifications.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      'PushPlatformNotificationsController:disablePushNotifications',
      this.disablePushNotifications.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      'PushPlatformNotificationsController:updateTriggerPushNotifications',
      this.updateTriggerPushNotifications.bind(this),
    );
  }

  async #getAndAssertBearerToken() {
    const bearerToken = await this.messagingSystem.call(
      'AuthenticationController:getBearerToken',
    );
    if (!bearerToken) {
      log.error(
        'Failed to enable push notifications: BearerToken token is missing.',
      );
      throw new Error('BearerToken token is missing');
    }

    return bearerToken;
  }

  /**
   * Enables push notifications for the application.
   *
   * This method sets up the necessary infrastructure for handling push notifications by:
   * 1. Registering the service worker to listen for messages.
   * 2. Fetching the Firebase Cloud Messaging (FCM) token from Firebase.
   * 3. Sending the FCM token to the server responsible for sending notifications, to register the device.
   *
   * @param UUIDs - An array of UUIDs to enable push notifications for.
   */
  public async enablePushNotifications(UUIDs: string[]) {
    // TEMP: disabling push notifications if browser does not support MV3.
    // Will need work to support firefox on MV2
    if (!isManifestV3) {
      return;
    }

    const bearerToken = await this.#getAndAssertBearerToken();

    try {
      // Activate Push Notifications
      const regToken = await activatePushNotifications(bearerToken, UUIDs);

      if (!regToken) {
        return;
      }

      // Listen to push notifications
      this.#pushListenerUnsubscribe ??= await listenToPushNotifications(
        (n) =>
          this.messagingSystem.publish(
            'PushPlatformNotificationsController:onNewNotifications',
            n,
          ),
        (n) =>
          this.messagingSystem.publish(
            'PushPlatformNotificationsController:pushNotificationClicked',
            n,
          ),
      );

      // Update state
      this.update((state) => {
        state.fcmToken = regToken;
      });
    } catch (error) {
      log.error('Failed to enable push notifications:', error);
      throw new Error('Failed to enable push notifications');
    }
  }

  /**
   * Disables push notifications for the application.
   * This method handles the process of disabling push notifications by:
   * 1. Unregistering the service worker to stop listening for messages.
   * 2. Sending a request to the server to unregister the device using the FCM token.
   * 3. Removing the FCM token from the state to complete the process.
   *
   * @param UUIDs - An array of UUIDs for which push notifications should be disabled.
   */
  public async disablePushNotifications(UUIDs: string[]) {
    // TEMP: disabling push notifications if browser does not support MV3.
    // Will need work to support firefox on MV2
    if (!isManifestV3) {
      return;
    }

    const bearerToken = await this.#getAndAssertBearerToken();
    let isPushNotificationsDisabled: boolean;

    try {
      // Send a request to the server to unregister the token/device
      isPushNotificationsDisabled = await deactivatePushNotifications(
        this.state.fcmToken,
        bearerToken,
        UUIDs,
      );
    } catch (error) {
      const errorMessage = `Failed to disable push notifications: ${error}`;
      log.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Remove the FCM token from the state
    if (!isPushNotificationsDisabled) {
      return;
    }

    // Unsubscribe from push notifications
    this.#pushListenerUnsubscribe?.();

    // Update State
    if (isPushNotificationsDisabled) {
      this.update((state) => {
        state.fcmToken = '';
      });
    }
  }

  /**
   * Updates the triggers for push notifications.
   * This method is responsible for updating the server with the new set of UUIDs that should trigger push notifications.
   * It uses the current FCM token and a BearerToken for authentication.
   *
   * @param UUIDs - An array of UUIDs that should trigger push notifications.
   */
  public async updateTriggerPushNotifications(UUIDs: string[]) {
    // TEMP: disabling push notifications if browser does not support MV3.
    // Will need work to support firefox on MV2
    if (!isManifestV3) {
      return;
    }

    const bearerToken = await this.#getAndAssertBearerToken();

    try {
      const { fcmToken } = await updateTriggerPushNotifications(
        this.state.fcmToken,
        bearerToken,
        UUIDs,
      );

      // update the state with the new FCM token
      if (fcmToken) {
        this.update((state) => {
          state.fcmToken = fcmToken;
        });
      }
    } catch (error) {
      const errorMessage = `Failed to update triggers for push notifications: ${error}`;
      log.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}
