import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { type NotificationServicesControllerMessenger } from '@metamask/notification-services-controller/notification-services';
import { HandleSnapRequest } from '@metamask/snaps-controllers';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | MessengerActions<NotificationServicesControllerMessenger>
  | HandleSnapRequest;

type Events = MessengerEvents<NotificationServicesControllerMessenger>;

export function getNotificationServicesControllerMessenger(
  messenger: RootMessenger<Actions, Events>,
): NotificationServicesControllerMessenger {
  const controllerMessenger = new Messenger<
    'NotificationServicesController',
    Actions,
    Events,
    typeof messenger
  >({
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
      'NotificationServicesPushController:enablePushNotifications',
      'NotificationServicesPushController:disablePushNotifications',
      'NotificationServicesPushController:subscribeToPushNotifications',
      // Snap Actions
      'SnapController:handleRequest',
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
