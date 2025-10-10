import { Messenger } from '@metamask/base-controller';
import type {
  AllowedActions,
  AllowedEvents,
  NotificationServicesPushControllerOnNewNotificationEvent,
  NotificationServicesPushControllerPushNotificationClickedEvent,
} from '@metamask/notification-services-controller/push-services';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller';

export type NotificationServicesPushControllerMessenger = ReturnType<
  typeof getNotificationServicesPushControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * notification services push controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 * @returns The restricted messenger.
 */
export function getNotificationServicesPushControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'NotificationServicesPushController',
    allowedActions: ['AuthenticationController:getBearerToken'],
    allowedEvents: [],
  });
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
  messenger: Messenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  return messenger.getRestricted({
    name: 'NotificationServicesPushControllerInit',
    allowedActions: ['MetaMetricsController:trackEvent'],
    allowedEvents: [
      'NotificationServicesPushController:onNewNotifications',
      'NotificationServicesPushController:pushNotificationClicked',
    ],
  });
}
