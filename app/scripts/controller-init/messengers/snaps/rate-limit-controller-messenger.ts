import { Messenger } from '@metamask/base-controller';
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
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'RateLimitController',
    allowedEvents: [],
    allowedActions: [],
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
  messenger: Messenger<InitActions, never>,
) {
  return messenger.getRestricted({
    name: 'RateLimitController',
    allowedActions: [
      'SubjectMetadataController:getState',
      'NotificationServicesController:updateMetamaskNotificationsList',
    ],
    allowedEvents: [],
  });
}
