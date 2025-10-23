import { Messenger } from '@metamask/messenger';
import {
  SnapInstalled,
  SnapUpdated,
  SnapDisabled,
  SnapEnabled,
  SnapUninstalled,
  HandleSnapRequest,
  GetAllSnaps,
} from '@metamask/snaps-controllers';
import {
  GetPermissions,
  GetSubjectMetadataState,
} from '@metamask/permission-controller';
import { NotificationServicesControllerUpdateMetamaskNotificationsList } from '@metamask/notification-services-controller/notification-services';
import { RootMessenger } from '..';

type Actions = GetPermissions | HandleSnapRequest | GetAllSnaps;

type Events =
  | SnapInstalled
  | SnapUpdated
  | SnapUninstalled
  | SnapEnabled
  | SnapDisabled;

export type RateLimitControllerMessenger = ReturnType<
  typeof getRateLimitControllerMessenger
>;

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
) {
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
