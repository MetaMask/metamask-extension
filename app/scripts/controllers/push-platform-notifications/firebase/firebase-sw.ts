/* eslint-disable import/unambiguous */
// eslint-disable-next-line spaced-comment
/// <reference lib="WebWorker" />

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
import type { MessagePayload } from 'firebase/messaging/sw';
import { onPushNotification } from './utils/get-notification-message';

const sw = self as unknown as ServiceWorkerGlobalScope;

export const initializeFirebaseSW = () => {
  // initialize firebase app
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    projectId: process.env.FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  // handle background messages
  onBackgroundMessage(messaging, (payload: MessagePayload) => {
    const typedPayload = payload;

    // if the payload does not contain data, do nothing
    try {
      const notificationData = typedPayload?.data?.data
        ? JSON.parse(typedPayload?.data?.data)
        : undefined;
      if (!notificationData) {
        return;
      }

      // This block retrieves all clients controlled by the service worker and sends them a message.
      // The message contains the notification data, allowing the clients to handle the notification
      sw.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            msg: notificationData.id,
          });
        });
      });

      // eslint-disable-next-line consistent-return
      return onPushNotification(notificationData);
    } catch (e) {
      // Do Nothing, cannot parse a bad notification
      console.error('Unable to send push notification', {
        notification: payload?.data?.data,
        error: e,
      });
    }
  });

  sw.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // TODO handle the specific URL to open for the notification
    const urlToOpen = `${sw.origin}/home.html#notifications/`;
    return sw.clients.openWindow(urlToOpen);
  });
};
