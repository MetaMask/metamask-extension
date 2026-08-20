// We are defining that this file uses a webworker global scope.
// eslint-disable-next-line spaced-comment
/// <reference lib="webworker" />

import type { PushAnalyticsPayload } from '@metamask/notification-services-controller/push-services';
import ExtensionPlatform from '../../platforms/extension';

const sw = self as unknown as ServiceWorkerGlobalScope;
const extensionPlatform = new ExtensionPlatform();

export async function onPushNotificationReceived(
  _payload: PushAnalyticsPayload,
): Promise<void> {
  // The OS renders the banner from the Web Push payload, and core re-fetches
  // the inbox when it receives the push message.
}

export async function onPushNotificationClicked(
  event: NotificationEvent,
  payload?: PushAnalyticsPayload,
) {
  // Close notification
  event.notification.close();

  // Get Data
  const data: PushAnalyticsPayload = payload ?? event?.notification?.data;

  // Navigate
  const destination = `${extensionPlatform.getExtensionURL(
    null,
    null,
  )}#notifications/${data.notification_id}`;
  event.waitUntil(sw.clients.openWindow(destination));
}
