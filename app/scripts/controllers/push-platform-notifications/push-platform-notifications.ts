import {
  BaseController,
  RestrictedControllerMessenger,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
} from '@metamask/base-controller';

import { getApp, initializeApp } from './firebase/firebase-app';
import {
  getMessaging,
  getToken,
  deleteToken,
} from './firebase/firebase-messaging';
import type { Messaging } from './types/types';

const controllerName = 'PushPlatformNotificationsController';

export type PushPlatformNotificationsControllerState = {
  pushPlatformNotifications: string[];
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

declare type PushPlatformNotificationsControllerMessanger =
  RestrictedControllerMessenger<
    typeof controllerName,
    PushPlatformNotificationsControllerMessengerActions,
    PushPlatformNotificationsControllerMessengerEvents,
    never,
    never
  >;

const metadata = {
  pushPlatformNotifications: {
    persist: true,
    anonymous: true,
  },
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
  constructor({
    messenger,
    state,
  }: {
    messenger: PushPlatformNotificationsControllerMessanger;
    state: PushPlatformNotificationsControllerState;
  }) {
    super({
      messenger,
      metadata,
      name: controllerName,
      state: {
        pushPlatformNotifications: state?.pushPlatformNotifications || [],
        fcmToken: state?.fcmToken || '',
      },
    });
  }

  /**
   * Attempts to retrieve an existing Firebase app instance. If no instance exists, it initializes a new app with the provided configuration.
   *
   * This method first tries to get an existing Firebase app by calling `getApp()`. If no app is found (an error is thrown), it then initializes a new Firebase app using the configuration specified in environment variables. The configuration includes the API key, auth domain, storage bucket, project ID, messaging sender ID, and app ID.
   *
   * @returns The Firebase app instance.
   */
  private createFirebaseApp() {
    try {
      return getApp();
    } catch {
      const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        projectId: process.env.FIREBASE_PROJECT_ID,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
      };

      return initializeApp(firebaseConfig);
    }
  }

  // This method is used to fetch the FCM token. This token must be sent to the server.
  private fetchToken() {
    const app = this.createFirebaseApp();
    const messaging = getMessaging(app);

    async function fetchToken(messagingInstance: Messaging) {
      const token = await getToken(messagingInstance, {
        vapidKey: process.env.VAPID_KEY,
      });

      return token;
    }

    const fmcToken = fetchToken(messaging);

    return fmcToken;
  }

  private async deleteToken() {
    const app = this.createFirebaseApp();
    const messaging = getMessaging(app);

    // Soft delete firebase token.
    // If fails to delete, we will still delete from IDB so this is fine
    await deleteToken(messaging);
  }

  // Placeholder: Currently logs messages from the service worker.
  // TODO: Implement functionality to update the badge and notification counter based on the received messages.
  private messageListener = (event: MessageEvent) => {
    console.log('Message from the service worker:', event);
  };

  /**
   * Enables push notifications for the application.
   *
   * This method sets up the necessary infrastructure for handling push notifications by:
   * 1. Registering the service worker to listen for messages.
   * 2. Fetching the Firebase Cloud Messaging (FCM) token from Firebase.
   * 3. Sending the FCM token to the server responsible for sending notifications, to register the device.
   *
   * Note: Step 3 are planned for future implementation.
   */
  public async enablePushNotifications() {
    // 1. Register the service worker and listen for messages
    navigator.serviceWorker
      .register('./firebase-messaging-sw.js')
      .then(() => {
        navigator.serviceWorker.addEventListener(
          'message',
          this.messageListener,
        );
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });

    // 2. Fetch the FCM token and update the state
    const fcmToken = await this.fetchToken();
    console.log('FCM token:', fcmToken);
    this.update((state) => {
      state.fcmToken = fcmToken;
    });

    // 3. TODO: Send the FCM token to the server
  }

  public async disablePushNotifications() {
    // 1. Stop the listener for messages
    navigator.serviceWorker.removeEventListener(
      'message',
      this.messageListener,
    );

    // 2. Unregister the service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Soft unregister service worker
        // this is to ensure that when we remove the registration token,
        // the service worker (that sends push notifications) is also removed
        const unregistrationResult = await registration.unregister();
        if (unregistrationResult) {
          console.log('Service worker unregistered successfully.');
        } else {
          console.log(
            'Service worker unregistration failed: No service worker found.',
          );
        }
      } catch (error) {
        console.error('Service worker unregistration failed:', error);
      }
    }

    // 3. TODO: Send a request to the server to unregister the token/device

    // 4. Delete the FCM token and clear it from the state
    await this.deleteToken();
    this.update((state) => {
      state.fcmToken = '';
    });
  }

  public async updateTriggerPushNotifications() {
    // TODO: Use thise method to update the push notification service when a user create new triggers
    // We need to make sure that this can be called if push notifications are enabled.
  }
}
