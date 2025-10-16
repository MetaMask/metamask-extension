import { Messenger } from '@metamask/base-controller';
import {
  GetAllSnaps,
  GetSnap,
  HandleSnapRequest,
} from '@metamask/snaps-controllers';
import { GetPermissionControllerState } from '@metamask/permission-controller';

type AllowedActions =
  | GetAllSnaps
  | GetSnap
  | HandleSnapRequest
  | GetPermissionControllerState;

export type SnapsNameProviderMessenger = ReturnType<
  typeof getSnapsNameProviderMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the Snaps
 * name provider.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSnapsNameProviderMessenger(
  messenger: Messenger<AllowedActions, never>,
) {
  return messenger.getRestricted({
    name: 'SnapsNameProvider',
    allowedActions: [
      'SnapController:getAll',
      'SnapController:get',
      'SnapController:handleRequest',
      'PermissionController:getState',
    ],
    allowedEvents: [],
  });
}
