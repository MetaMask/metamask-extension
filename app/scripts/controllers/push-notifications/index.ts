// We are defining that this file uses a webworker global scope.
// eslint-disable-next-line spaced-comment
/// <reference lib="webworker" />

import { NotificationServicesController } from '@metamask/notification-services-controller';
import ExtensionPlatform from '../../platforms/extension';
import { getNotificationImage } from './get-notification-image';
import { createNotificationMessage } from './get-notification-message';

type INotification = NotificationServicesController.Types.INotification;

const sw = self as unknown as ServiceWorkerGlobalScope;
const extensionPlatform = new ExtensionPlatform();

export async function onPushNotificationReceived(
  notification: INotification,
): Promise<void> {
  const notificationMessage = createNotificationMessage(notification);
  if (!notificationMessage) {
    return;
  }

  const registration = sw?.registration;
  if (!registration) {
    return;
  }

  const iconUrl = await getNotificationImage();

  await registration.showNotification(notificationMessage.title, {
    body: notificationMessage.description,
    icon: iconUrl,
    tag: notification?.id,
    data: notification,
  });
}

export async function onPushNotificationClicked(
  event: NotificationEvent,
  notification?: INotification,
) {
  // Close notification
  event.notification.close();

  // Get Data
  const data: INotification = notification ?? event?.notification?.data;

  // Navigate
  const destination = `${extensionPlatform.getExtensionURL(
    null,
    null,
  )}#notifications/${data.id}`;
  event.waitUntil(sw.clients.openWindow(destination));
}
