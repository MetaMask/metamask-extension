import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountAssetListUpdatedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerListMultichainAccountsAction,
} from '@metamask/accounts-controller';
import { Messenger } from '@metamask/messenger';
import { GetPermissions } from '@metamask/permission-controller';
import { GetAllSnaps, HandleSnapRequest } from '@metamask/snaps-controllers';
import { RootMessenger } from '../../../lib/messenger';

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
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'MultichainAssetsController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'MultichainAssetsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:accountAssetListUpdated',
    ],
    actions: [
      'PermissionController:getPermissions',
      'SnapController:handleRequest',
      'SnapController:getAll',
      'AccountsController:listMultichainAccounts',
    ],
  });
  return controllerMessenger;
}
