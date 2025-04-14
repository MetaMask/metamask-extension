import { Messenger } from '@metamask/base-controller';
import { AccountsControllerListMultichainAccountsAction, GetAllSnaps, HandleSnapRequest } from '@metamask/snaps-controllers';
import { GetPermissions } from '@metamask/permission-controller';
import { KeyringControllerWithKeyringAction } from '@metamask/keyring-controller';

type Actions =
  | GetAllSnaps
  | HandleSnapRequest
  | GetPermissions
  | AccountsControllerListMultichainAccountsAction


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
    ],
    allowedEvents: [],
  });
}

type InitActions = KeyringControllerWithKeyringAction

export type MultichainRouterInitMessenger = ReturnType<
  typeof getRateLimitControllerInitMessenger
>;

/**
 * Get a restricted controller messenger for Multichain Router initialization. This is
 * scoped to the actions and events that the Multichain Router needs for instantiation.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getRateLimitControllerInitMessenger(
  messenger: Messenger<InitActions, never>,
) {
  return messenger.getRestricted({
    name: 'MultichainRouter',
    allowedActions: [
      'KeyringController:withKeyring',
    ],
    allowedEvents: [],
  });
}
