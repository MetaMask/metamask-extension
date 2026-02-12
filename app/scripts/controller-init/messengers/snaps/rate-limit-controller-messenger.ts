import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import {
  RateLimitMessenger,
  RateLimitedApiMap,
} from '@metamask/rate-limit-controller';
import { GetSubjectMetadataState } from '@metamask/permission-controller';
import { NotificationServicesControllerUpdateMetamaskNotificationsList } from '@metamask/notification-services-controller/notification-services';
import { RootMessenger } from '../../../lib/messenger';

export type RateLimitControllerMessenger =
  RateLimitMessenger<RateLimitedApiMap>;

type Actions = MessengerActions<RateLimitControllerMessenger>;

type Events = MessengerEvents<RateLimitControllerMessenger>;

/**
 * Get a restricted controller messenger for the rate limit controller. This is
 * scoped to the actions and events that the rate limit controller is allowed to
 * handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getRateLimitControllerMessenger(
  messenger: RootMessenger<Actions, Events>,
): RateLimitControllerMessenger {
  return new Messenger<
    'RateLimitController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'RateLimitController',
    parent: messenger,
  });
}

type InitActions =
  | GetSubjectMetadataState
  | NotificationServicesControllerUpdateMetamaskNotificationsList;

export type RateLimitControllerInitMessenger = ReturnType<
  typeof getRateLimitControllerInitMessenger
>;

/**
 * Get a restricted controller messenger for the rate limit controller. This is
 * scoped to the actions and events that the rate limit controller is allowed to
 * handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getRateLimitControllerInitMessenger(
  messenger: RootMessenger<InitActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'RateLimitController',
    InitActions,
    never,
    typeof messenger
  >({
    namespace: 'RateLimitController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'SubjectMetadataController:getState',
      'NotificationServicesController:updateMetamaskNotificationsList',
    ],
  });
  return controllerInitMessenger;
}
