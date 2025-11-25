import { Messenger } from '@metamask/messenger';
import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerListMultichainAccountsAction,
  AccountsControllerAccountTransactionsUpdatedEvent,
} from '@metamask/accounts-controller';
import { HandleSnapRequest } from '@metamask/snaps-controllers';
import { KeyringControllerGetStateAction } from '@metamask/keyring-controller';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | AccountsControllerListMultichainAccountsAction
  | HandleSnapRequest
  | KeyringControllerGetStateAction;

type Events =
  | AccountsControllerAccountAddedEvent
  | AccountsControllerAccountRemovedEvent
  | AccountsControllerAccountTransactionsUpdatedEvent;

export type MultichainTransactionsControllerMessenger = ReturnType<
  typeof getMultichainTransactionsControllerMessenger
>;

/**
 * Get a restricted messenger for the Multichain Transactions controller. This is scoped to the
 * actions and events that the Multichain Transactions controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getMultichainTransactionsControllerMessenger(
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'MultichainTransactionsController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'MultichainTransactionsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:accountTransactionsUpdated',
    ],
    actions: [
      'AccountsController:listMultichainAccounts',
      'SnapController:handleRequest',
      'KeyringController:getState',
    ],
  });
  return controllerMessenger;
}
