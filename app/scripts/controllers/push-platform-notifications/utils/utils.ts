import type { FirebaseApp } from '../types/firebase';
import {
  getMessaging,
  getToken,
  deleteToken,
} from '../firebase/lib/firebase-messaging';
import { getApp, initializeApp } from '../firebase/lib/firebase-app';

const url = process.env.PUSH_NOTIFICATIONS_SERVICE_URL;
const REGISTRATION_TOKENS_ENDPOINT = `${url}/v1/link`;

export type LinksResult = {
  trigger_ids: string[];
  registration_tokens: string[];
};

export class PushPlatformNotificationsUtils {
  /**
   * Attempts to retrieve an existing Firebase app instance. If no instance exists, it initializes a new app with the provided configuration.
   *
   * @returns The Firebase app instance.
   */
  static async createFirebaseApp(): Promise<FirebaseApp> {
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
        measurementId: process.env.FIREBASE_MEASUREMENT_ID,
      };
      return initializeApp(firebaseConfig);
    }
  }

  /**
   * Creates a registration token for Firebase Cloud Messaging.
   *
   * @returns A promise that resolves with the registration token or null if an error occurs.
   */
  private static async createRegToken(): Promise<string | null> {
    try {
      const app = await this.createFirebaseApp();
      const messaging = getMessaging(app);
      return getToken(messaging, { vapidKey: process.env.VAPID_KEY });
    } catch {
      return null;
    }
  }

  /**
   * Deletes the Firebase Cloud Messaging registration token.
   *
   * @returns A promise that resolves with true if the token was successfully deleted, false otherwise.
   */
  private static async deleteRegToken(): Promise<boolean> {
    try {
      const app = await this.createFirebaseApp();
      const messaging = getMessaging(app);
      await deleteToken(messaging);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetches push notification links from a remote endpoint using a BearerToken for authorization.
   *
   * @param bearerToken - The JSON Web Token used for authorization.
   * @returns A promise that resolves with the links result or null if an error occurs.
   */
  private static async getPushNotificationLinks(
    bearerToken: string,
  ): Promise<LinksResult | null> {
    try {
      const response = await fetch(REGISTRATION_TOKENS_ENDPOINT, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch links');
      }
      return response.json() as Promise<LinksResult>;
    } catch {
      return null;
    }
  }

  /**
   * Updates the push notification links on a remote API.
   *
   * @param bearerToken - The JSON Web Token used for authorization.
   * @param triggers - An array of trigger identifiers.
   * @param regTokens - An array of registration tokens.
   * @returns A promise that resolves with true if the update was successful, false otherwise.
   */
  private static async updateLinksAPI(
    bearerToken: string,
    triggers: string[],
    regTokens: string[],
  ): Promise<boolean> {
    try {
      const body: LinksResult = {
        trigger_ids: triggers,
        registration_tokens: regTokens,
      };
      const response = await fetch(
        `${process.env.PUSH_NOTIFICATIONS_SERVICE_URL}/v1/link`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Enables push notifications by registering the device and linking triggers.
   *
   * @param bearerToken - The JSON Web Token used for authorization.
   * @param triggers - An array of trigger identifiers.
   * @returns A promise that resolves with an object containing the success status and the BearerToken token.
   */
  public static async enablePushNotifications(
    bearerToken: string,
    triggers: string[],
  ): Promise<string | null> {
    const notificationLinks = await this.getPushNotificationLinks(bearerToken);
    if (!notificationLinks) {
      return null;
    }

    const regToken = await this.createRegToken().catch(() => null);
    if (!regToken) {
      return null;
    }

    const newRegTokens = new Set(notificationLinks.registration_tokens);
    newRegTokens.add(regToken);

    await this.updateLinksAPI(bearerToken, triggers, Array.from(newRegTokens));
    return regToken;
  }

  /**
   * Disables push notifications by removing the registration token and unlinking triggers.
   *
   * @param regToken - The registration token to be removed.
   * @param bearerToken - The JSON Web Token used for authorization.
   * @param triggers - An array of trigger identifiers to be unlinked.
   * @returns A promise that resolves with true if notifications were successfully disabled, false otherwise.
   */
  public static async disablePushNotifications(
    regToken: string,
    bearerToken: string,
    triggers: string[],
  ): Promise<boolean> {
    // if we don't have a reg token, then we can early return
    if (!regToken) {
      return true;
    }

    const notificationLinks = await this.getPushNotificationLinks(bearerToken);
    if (!notificationLinks) {
      return false;
    }

    const regTokenSet = new Set(notificationLinks.registration_tokens);
    regTokenSet.delete(regToken);

    const isTokenRemovedFromAPI = await this.updateLinksAPI(
      bearerToken,
      triggers,
      Array.from(regTokenSet),
    );
    if (!isTokenRemovedFromAPI) {
      return false;
    }

    const isTokenRemovedFromFCM = await this.deleteRegToken();
    if (!isTokenRemovedFromFCM) {
      return false;
    }

    return true;
  }

  /**
   * Updates the triggers linked to push notifications for a given registration token.
   *
   * @param regToken - The registration token to update triggers for.
   * @param bearerToken - The JSON Web Token used for authorization.
   * @param triggers - An array of new trigger identifiers to link.
   * @returns A promise that resolves with true if the triggers were successfully updated, false otherwise.
   */
  public static async updateTriggerPushNotifications(
    regToken: string,
    bearerToken: string,
    triggers: string[],
  ): Promise<boolean> {
    const notificationLinks = await this.getPushNotificationLinks(bearerToken);
    if (!notificationLinks) {
      return false;
    }

    // Create new registration token if doesn't exist
    const regTokenSet = new Set(notificationLinks.registration_tokens);
    if (!regToken || !regTokenSet.has(regToken)) {
      await this.deleteRegToken();
      const newRegToken = await this.createRegToken();
      if (!newRegToken) {
        throw new Error('Failed to create a new registration token');
      }
      regTokenSet.add(newRegToken);
    }

    const isTriggersLinkedToPushNotifications = await this.updateLinksAPI(
      bearerToken,
      triggers,
      Array.from(regTokenSet),
    );

    return isTriggersLinkedToPushNotifications;
  }
}
