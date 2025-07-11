import { Messenger } from '@metamask/base-controller';
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
import { AccountActivityServiceBalanceUpdatedEvent } from '@metamask/backend-platform';

type Actions =
  | AccountsControllerListMultichainAccountsAction
  | HandleSnapRequest
  | MultichainAssetsControllerGetStateAction
  | KeyringControllerGetStateAction;

type Events =
  | AccountsControllerAccountAddedEvent
  | AccountsControllerAccountRemovedEvent
  | AccountsControllerAccountBalancesUpdatesEvent
  | MultichainAssetsControllerAccountAssetListUpdatedEvent
  | AccountActivityServiceBalanceUpdatedEvent;

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
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'MultichainBalancesController',
    allowedEvents: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:accountBalancesUpdated',
      'MultichainAssetsController:accountAssetListUpdated',
      'AccountActivityService:balanceUpdated',
    ],
    allowedActions: [
      'AccountsController:listMultichainAccounts',
      'SnapController:handleRequest',
      'MultichainAssetsController:getState',
      'KeyringController:getState',
    ],
  });
}
