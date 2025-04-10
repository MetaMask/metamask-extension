import { Messenger } from '@metamask/base-controller';
import { AccountsControllerListMultichainAccountsAction, GetAllSnaps, HandleSnapRequest } from '@metamask/snaps-controllers';
import { GetPermissions } from '@metamask/permission-controller';
import { KeyringControllerWithKeyringAction } from '@metamask/keyring-controller';

type Actions =
  | GetAllSnaps
  | HandleSnapRequest
  | GetPermissions
  | AccountsControllerListMultichainAccountsAction
  | KeyringControllerWithKeyringAction


type Events = never;

export type MultichainRouterMessenger = ReturnType<
  typeof getMultichainRouterMessenger
>;

/**
 * Get a restricted messenger for the Multichain Router. This is scoped to the
 * actions and events that the Multichain Router is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getMultichainRouterMessenger(
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'MultichainRouter',
    allowedActions: [
      `SnapController:getAll`,
      `SnapController:handleRequest`,
      `PermissionController:getPermissions`,
      `AccountsController:listMultichainAccounts`,
      `KeyringController:withKeyring`,
    ],
    allowedEvents: [],
  });
}
