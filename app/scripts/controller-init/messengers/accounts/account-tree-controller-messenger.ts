import { Messenger } from '@metamask/base-controller';
import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerListMultichainAccountsAction,
} from '@metamask/accounts-controller';
import { GetSnap as SnapControllerGet } from '@metamask/snaps-controllers';
import { KeyringControllerGetStateAction } from '@metamask/keyring-controller';

type Actions =
  | AccountsControllerListMultichainAccountsAction
  | SnapControllerGet
  | KeyringControllerGetStateAction;

type Events =
  | AccountsControllerAccountAddedEvent
  | AccountsControllerAccountRemovedEvent;

export type AccountTreeControllerMessenger = ReturnType<
  typeof getAccountTreeControllerMessenger
>;

/**
 * Get a restricted messenger for the account wallet controller. This is scoped to the
 * actions and events that this controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getAccountTreeControllerMessenger(
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'AccountTreeController',
    allowedEvents: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
    ],
    allowedActions: [
      'AccountsController:listMultichainAccounts',
      'SnapController:get',
      'KeyringController:getState',
    ],
  });
}

/**
 * Get a restricted messenger for the account wallet controller. This is scoped to the
 * actions and events that this controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getAccountTreeControllerInitMessenger(
  messenger: Messenger<Actions, Events>,
) {
  // Our `init` method needs the same actions, so just re-use the same messenger
  // function here.
  return getAccountTreeControllerMessenger(messenger);
}
