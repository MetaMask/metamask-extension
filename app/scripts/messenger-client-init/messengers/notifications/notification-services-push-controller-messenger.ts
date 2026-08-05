import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type {
  NotificationServicesPushControllerOnNewNotificationEvent,
  NotificationServicesPushControllerPushNotificationClickedEvent,
  NotificationServicesPushControllerMessenger,
} from '@metamask/notification-services-controller/push-services';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * notification services push controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 * @returns The restricted messenger.
 */
export function getNotificationServicesPushControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<NotificationServicesPushControllerMessenger>,
    MessengerEvents<NotificationServicesPushControllerMessenger>
  >,
) {
  const controllerMessenger: NotificationServicesPushControllerMessenger =
    new Messenger({
      namespace: 'NotificationServicesPushController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['AuthenticationController:getBearerToken'],
  });
  return controllerMessenger;
}

type AllowedInitializationEvents =
  | NotificationServicesPushControllerOnNewNotificationEvent
  | NotificationServicesPushControllerPushNotificationClickedEvent;

export type NotificationServicesPushControllerInitMessenger = ReturnType<
  typeof getNotificationServicesPushControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed initialization actions of the
 * notification services push controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 * @returns The restricted messenger.
 */
export function getNotificationServicesPushControllerInitMessenger(
  messenger: RootMessenger<never, AllowedInitializationEvents>,
) {
  const controllerInitMessenger = new Messenger<
    'NotificationServicesPushControllerInit',
    never,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'NotificationServicesPushControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    events: [
      'NotificationServicesPushController:onNewNotifications',
      'NotificationServicesPushController:pushNotificationClicked',
    ],
  });
  return controllerInitMessenger;
}
