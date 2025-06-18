import { Messenger } from '@metamask/base-controller';
import {
  type NotificationServicesControllerMessenger,
  type AllowedActions,
  type AllowedEvents,
} from '@metamask/notification-services-controller/notification-services';

export { type NotificationServicesControllerMessenger } from '@metamask/notification-services-controller/notification-services';

export function getNotificationServicesControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
): NotificationServicesControllerMessenger {
  return messenger.getRestricted({
    name: 'NotificationServicesController',
    allowedActions: [
      // Keyring Actions
      'KeyringController:getState',
      // Auth Actions
      'AuthenticationController:getBearerToken',
      'AuthenticationController:isSignedIn',
      'AuthenticationController:performSignIn',
      // Storage Actions
      'UserStorageController:getStorageKey',
      'UserStorageController:performGetStorage',
      'UserStorageController:performSetStorage',
      // Push Actions
      'NotificationServicesPushController:enablePushNotifications',
      'NotificationServicesPushController:disablePushNotifications',
      'NotificationServicesPushController:subscribeToPushNotifications',
      'NotificationServicesPushController:updateTriggerPushNotifications',
    ],
    allowedEvents: [
      // Keyring Events
      'KeyringController:stateChange',
      'KeyringController:lock',
      'KeyringController:unlock',
      // Push Notification Events
      'NotificationServicesPushController:onNewNotifications',
      'NotificationServicesPushController:stateChange',
    ],
  });
}
