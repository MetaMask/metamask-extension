import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import {
  type AuthenticatedUserStorageServiceGetNotificationPreferencesAction,
  type AuthenticatedUserStorageServicePutNotificationPreferencesAction,
} from '@metamask/authenticated-user-storage';
import {
  type KeyringControllerLockEvent,
  type KeyringControllerStateChangeEvent,
  type KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import { type NotificationServicesControllerMessenger } from '@metamask/notification-services-controller/notification-services';
import {
  type NotificationServicesPushControllerOnNewNotificationEvent,
  type NotificationServicesPushControllerStateChangeEvent,
} from '@metamask/notification-services-controller/push-services';
import { RootMessenger } from '../../../lib/messenger';

type DelegatedActions =
  | MessengerActions<NotificationServicesControllerMessenger>
  | AuthenticatedUserStorageServiceGetNotificationPreferencesAction
  | AuthenticatedUserStorageServicePutNotificationPreferencesAction;

type DelegatedEvents =
  | KeyringControllerStateChangeEvent
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent
  | NotificationServicesPushControllerOnNewNotificationEvent
  | NotificationServicesPushControllerStateChangeEvent;

type DelegatableNotificationServicesControllerMessenger = Messenger<
  'NotificationServicesController',
  DelegatedActions,
  DelegatedEvents
>;

type AllowedActions =
  | MessengerActions<NotificationServicesControllerMessenger>
  | AuthenticatedUserStorageServiceGetNotificationPreferencesAction
  | AuthenticatedUserStorageServicePutNotificationPreferencesAction;

export function getNotificationServicesControllerMessenger(
  messenger: RootMessenger<
    AllowedActions,
    MessengerEvents<NotificationServicesControllerMessenger>
  >,
): NotificationServicesControllerMessenger {
  const controllerMessenger: DelegatableNotificationServicesControllerMessenger =
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
      // Authenticated User Storage Actions
      'AuthenticatedUserStorageService:getNotificationPreferences',
      'AuthenticatedUserStorageService:putNotificationPreferences',
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
  return controllerMessenger as NotificationServicesControllerMessenger;
}
