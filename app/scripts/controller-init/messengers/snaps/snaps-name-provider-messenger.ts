import { Messenger } from '@metamask/messenger';
import {
  GetAllSnaps,
  GetSnap,
  HandleSnapRequest,
} from '@metamask/snaps-controllers';
import { GetPermissionControllerState } from '@metamask/permission-controller';
import { RootMessenger } from '../../../lib/messenger';

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
  messenger: RootMessenger<AllowedActions, never>,
) {
  const providerMessenger = new Messenger<
    'SnapsNameProvider',
    AllowedActions,
    never,
    typeof messenger
  >({
    namespace: 'SnapsNameProvider',
    parent: messenger,
  });
  messenger.delegate({
    messenger: providerMessenger,
    actions: [
      'SnapController:getAll',
      'SnapController:get',
      'SnapController:handleRequest',
      'PermissionController:getState',
    ],
  });
  return providerMessenger;
}
