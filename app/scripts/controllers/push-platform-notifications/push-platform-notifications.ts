import {
  BaseController,
  RestrictedControllerMessenger,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
} from '@metamask/base-controller';
import log from 'loglevel';

import { PushPlatformNotificationsUtils } from './utils/utils';

const controllerName = 'PushPlatformNotificationsController';

export type PushPlatformNotificationsControllerState = {
  fcmToken: string;
};

export type PushPlatformNotificationsControllerMessengerActions =
  ControllerGetStateAction<'state', PushPlatformNotificationsControllerState>;

export declare type PushPlatformNotificationsReceived = {
  type: `${typeof controllerName}:PushPlatformNotificationsReceived`;
  payload: [string];
};

export type PushPlatformNotificationsControllerMessengerEvents =
  | PushPlatformNotificationsReceived
  | ControllerStateChangeEvent<
      typeof controllerName,
      PushPlatformNotificationsControllerState
    >;

export type PushPlatformNotificationsControllerMessanger =
  RestrictedControllerMessenger<
    typeof controllerName,
    PushPlatformNotificationsControllerMessengerActions,
    PushPlatformNotificationsControllerMessengerEvents,
    never,
    never
  >;

const metadata = {
  fcmToken: {
    persist: true,
    anonymous: true,
  },
};

export class PushPlatformNotificationsController extends BaseController<
  typeof controllerName,
  PushPlatformNotificationsControllerState,
  PushPlatformNotificationsControllerMessanger
> {
  private getJwtToken: () => Promise<string>;

  constructor({
    messenger,
    state,
    getJwtToken,
  }: {
    messenger: PushPlatformNotificationsControllerMessanger;
    state: PushPlatformNotificationsControllerState;
    getJwtToken: () => Promise<string>;
  }) {
    super({
      messenger,
      metadata,
      name: controllerName,
      state: {
        fcmToken: state?.fcmToken || '',
      },
    });

    this.getJwtToken = getJwtToken;
    this.messageListener = this.messageListener.bind(this);
  }

  /**
   * Listens for messages from the service worker.
   * When a message is received, it publishes an event to the messaging system.
   *
   * @param event - The message event.
   * @fires `${controllerName}:PushPlatformNotificationsReceived`
   */
  private async messageListener(event: MessageEvent) {
    this.messagingSystem.publish(
      `${controllerName}:PushPlatformNotificationsReceived`,
      event.data.msg,
    );
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
    const jwt = await this.getJwtToken();
    if (!jwt) {
      log.error('Failed to enable push notifications: JWT token is missing.');
      throw new Error();
    }

    try {
      // 1. Register the service worker and listen for messages
      await navigator.serviceWorker.register('./firebase-messaging-sw.js');
      navigator.serviceWorker.addEventListener('message', this.messageListener);

      // 2. Call the enablePushNotifications method from PushPlatformNotificationsUtils
      const regToken =
        await PushPlatformNotificationsUtils.enablePushNotifications(
          jwt,
          UUIDs,
        );

      // 3. Update the state with the FCM token
      if (regToken) {
        this.update((state) => {
          state.fcmToken = regToken;
        });
      }
    } catch (error) {
      log.error('Failed to enable push notifications:', error);
      throw new Error();
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
    const jwt = await this.getJwtToken();
    if (!jwt) {
      log.error('Failed to enable push notifications: JWT token is missing.');
      throw new Error();
    }

    try {
      // 1. Unregister the service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const targetRegistration = registrations.find(
          (registration) =>
            registration.active &&
            registration.active.scriptURL.endsWith('firebase-messaging-sw.js'),
        );
        try {
          // Soft unregister service worker
          // this is to ensure that when we remove the registration token,
          // the service worker (that sends push notifications) is also removed
          await targetRegistration?.unregister().catch(() => null);
        } catch (error) {
          console.error('Service worker unregistration failed:', error);
        }
      }
    } catch (error) {
      log.error('Failed to disable push notifications:', error);
      throw new Error();
    }

    // 2. Send a request to the server to unregister the token/device
    const isPushNotificationsDisabled =
      await PushPlatformNotificationsUtils.disablePushNotifications(
        this.state.fcmToken,
        jwt,
        UUIDs,
      );

    // 3. Remove the FCM token from the state
    if (isPushNotificationsDisabled) {
      this.update((state) => {
        state.fcmToken = '';
      });
    }
  }

  /**
   * Updates the triggers for push notifications.
   * This method is responsible for updating the server with the new set of UUIDs that should trigger push notifications.
   * It uses the current FCM token and a JWT for authentication.
   *
   * @param UUIDs - An array of UUIDs that should trigger push notifications.
   */
  public async updateTriggerPushNotifications(UUIDs: string[]) {
    const jwt = await this.getJwtToken();
    if (!jwt) {
      log.error('Failed to enable push notifications: JWT token is missing.');
      throw new Error();
    }

    try {
      PushPlatformNotificationsUtils.updateTriggerPushNotifications(
        this.state.fcmToken,
        jwt,
        UUIDs,
      );
    } catch (error) {
      log.error('Failed to update triggers for push notifications:', error);
      throw new Error();
    }
  }
}
