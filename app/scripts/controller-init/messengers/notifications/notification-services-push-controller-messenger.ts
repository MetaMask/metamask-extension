import { Messenger } from '@metamask/base-controller';
import {
  type NotificationServicesPushControllerMessenger,
  type AllowedActions,
  type AllowedEvents,
} from '@metamask/notification-services-controller/push-services';

export { type NotificationServicesPushControllerMessenger } from '@metamask/notification-services-controller/push-services';

export function getNotificationServicesPushControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
): NotificationServicesPushControllerMessenger {
  return messenger.getRestricted({
    name: 'NotificationServicesPushController',
    allowedActions: ['AuthenticationController:getBearerToken'],
    allowedEvents: [],
  });
}
