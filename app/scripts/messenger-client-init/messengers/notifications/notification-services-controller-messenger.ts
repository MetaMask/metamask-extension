import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { type NotificationServicesControllerMessenger } from '@metamask/notification-services-controller/notification-services';
import { RootMessenger } from '../../../lib/messenger';

export function getNotificationServicesControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<NotificationServicesControllerMessenger>,
    MessengerEvents<NotificationServicesControllerMessenger>
  >,
): NotificationServicesControllerMessenger {
  const controllerMessenger: NotificationServicesControllerMessenger =
    new Messenger({
      namespace: 'NotificationServicesController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      // Keyring Actions
      'KeyringController:getState',
      // Auth Actions
      'AuthenticationController:getBearerToken',
      'AuthenticationController:isSignedIn',
      'AuthenticationController:performSignIn',
      // Push Actions
      'NotificationServicesPushController:addPushNotificationLinks',
      'NotificationServicesPushController:enablePushNotifications',
      'NotificationServicesPushController:disablePushNotifications',
      'NotificationServicesPushController:deletePushNotificationLinks',
      'NotificationServicesPushController:subscribeToPushNotifications',
    ],
    events: [
      // Keyring Events
      'KeyringController:stateChange',
      'KeyringController:lock',
      'KeyringController:unlock',
      // Push Notification Events
      'NotificationServicesPushController:onNewNotifications',
      'NotificationServicesPushController:stateChange',
    ],
  });
  return controllerMessenger;
}
