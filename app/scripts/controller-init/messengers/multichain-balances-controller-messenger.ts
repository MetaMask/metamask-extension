import { Messenger } from '@metamask/base-controller';
import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerListMultichainAccountsAction,
  AccountsControllerAccountBalancesUpdatesEvent,
} from '@metamask/accounts-controller';
import { HandleSnapRequest } from '@metamask/snaps-controllers';
import {
  MultichainAssetsControllerGetStateAction,
  MultichainAssetsControllerStateChangeEvent,
  MultichainBalancesControllerMessenger,
} from '@metamask/assets-controllers';

type MessengerEvents =
  | AccountsControllerAccountAddedEvent
  | AccountsControllerAccountRemovedEvent
  | AccountsControllerAccountBalancesUpdatesEvent
  | MultichainAssetsControllerStateChangeEvent;

type MessengerActions =
  | AccountsControllerListMultichainAccountsAction
  | HandleSnapRequest
  | MultichainAssetsControllerGetStateAction;

export type MultichainBalancesControllerInitMessenger = ReturnType<
  typeof getMultichainBalancesControllerInitMessenger
>;

export function getMultichainBalancesControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
): MultichainBalancesControllerMessenger {
  return messenger.getRestricted({
    name: 'MultichainBalancesController',
    allowedEvents: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:accountBalancesUpdated',
      'MultichainAssetsController:stateChange',
    ],
    allowedActions: [
      'AccountsController:listMultichainAccounts',
      'SnapController:handleRequest',
      'MultichainAssetsController:getState',
    ],
  }) as unknown as MultichainBalancesControllerMessenger;
}

export function getMultichainBalancesControllerInitMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
) {
  return messenger.getRestricted({
    name: 'MultichainBalancesControllerInit',
    allowedEvents: [],
    allowedActions: [],
  });
}
