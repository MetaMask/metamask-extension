import { Messenger } from '@metamask/base-controller';
import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerListMultichainAccountsAction,
  AccountsControllerAccountTransactionsUpdatedEvent,
} from '@metamask/accounts-controller';
import { HandleSnapRequest } from '@metamask/snaps-controllers';

type MessengerEvents =
  | AccountsControllerAccountAddedEvent
  | AccountsControllerAccountRemovedEvent
  | AccountsControllerAccountTransactionsUpdatedEvent;

type MessengerActions =
  | AccountsControllerListMultichainAccountsAction
  | HandleSnapRequest;

export type MultichainTransactionsControllerInitMessenger = ReturnType<
  typeof getMultichainTransactionsControllerInitMessenger
>;

export function getMultichainTransactionsControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
) {
  return messenger.getRestricted({
    name: 'MultichainTransactionsController',
    allowedEvents: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:accountTransactionsUpdated',
    ],
    allowedActions: [
      'AccountsController:listMultichainAccounts',
      'SnapController:handleRequest',
    ],
  });
}

export function getMultichainTransactionsControllerInitMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
) {
  return messenger.getRestricted({
    name: 'MultichainTransactionsControllerInit',
    allowedEvents: [],
    allowedActions: [],
  });
}
