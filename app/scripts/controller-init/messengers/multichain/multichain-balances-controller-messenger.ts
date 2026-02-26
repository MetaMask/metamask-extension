import { Messenger } from '@metamask/messenger';
import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerListMultichainAccountsAction,
  AccountsControllerAccountBalancesUpdatesEvent,
} from '@metamask/accounts-controller';
import { HandleSnapRequest } from '@metamask/snaps-controllers';
import {
  MultichainAssetsControllerAccountAssetListUpdatedEvent,
  MultichainAssetsControllerGetStateAction,
} from '@metamask/assets-controllers';
import { KeyringControllerGetStateAction } from '@metamask/keyring-controller';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | AccountsControllerListMultichainAccountsAction
  | HandleSnapRequest
  | MultichainAssetsControllerGetStateAction
  | KeyringControllerGetStateAction;

type Events =
  | AccountsControllerAccountAddedEvent
  | AccountsControllerAccountRemovedEvent
  | AccountsControllerAccountBalancesUpdatesEvent
  | MultichainAssetsControllerAccountAssetListUpdatedEvent;

export type MultichainBalancesControllerMessenger = ReturnType<
  typeof getMultichainBalancesControllerMessenger
>;

/**
 * Get a restricted messenger for the Multichain Balances controller. This is scoped to the
 * actions and events that the Multichain Balances controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getMultichainBalancesControllerMessenger(
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'MultichainBalancesController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'MultichainBalancesController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:accountBalancesUpdated',
      'MultichainAssetsController:accountAssetListUpdated',
    ],
    actions: [
      'AccountsController:listMultichainAccounts',
      'SnapController:handleRequest',
      'MultichainAssetsController:getState',
      'KeyringController:getState',
    ],
  });
  return controllerMessenger;
}
