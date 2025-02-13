import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountAssetListUpdatedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerListMultichainAccountsAction,
} from '@metamask/accounts-controller';
import { Messenger } from '@metamask/base-controller';
import { GetPermissions } from '@metamask/permission-controller';
import { GetAllSnaps, HandleSnapRequest } from '@metamask/snaps-controllers';

type Actions =
  | HandleSnapRequest
  | GetAllSnaps
  | GetPermissions
  | AccountsControllerListMultichainAccountsAction;

type Events =
  | AccountsControllerAccountAddedEvent
  | AccountsControllerAccountRemovedEvent
  | AccountsControllerAccountAssetListUpdatedEvent;

export type MultichainAssetsControllerMessenger = ReturnType<
  typeof getMultichainAssetsControllerMessenger
>;

/**
 * Get a restricted messenger for the Multichain Assets controller. This is scoped to the
 * actions and events that the multichain Assets controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getMultichainAssetsControllerMessenger(
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'MultichainAssetsController',
    allowedEvents: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:accountAssetListUpdated',
    ],
    allowedActions: [
      'PermissionController:getPermissions',
      'SnapController:handleRequest',
      'SnapController:getAll',
      'AccountsController:listMultichainAccounts',
    ],
  });
}
