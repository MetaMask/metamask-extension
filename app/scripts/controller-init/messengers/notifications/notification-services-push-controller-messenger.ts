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
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller';
import { RootMessenger } from '../../../lib/messenger';

type Actions = MessengerActions<NotificationServicesPushControllerMessenger>;

type Events = MessengerEvents<NotificationServicesPushControllerMessenger>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * notification services push controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 * @returns The restricted messenger.
 */
export function getNotificationServicesPushControllerMessenger(
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'NotificationServicesPushController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'NotificationServicesPushController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['AuthenticationController:getBearerToken'],
  });
  return controllerMessenger;
}

type AllowedInitializationActions = MetaMetricsControllerTrackEventAction;

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
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'NotificationServicesPushControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'NotificationServicesPushControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['MetaMetricsController:trackEvent'],
    events: [
      'NotificationServicesPushController:onNewNotifications',
      'NotificationServicesPushController:pushNotificationClicked',
    ],
  });
  return controllerInitMessenger;
}
