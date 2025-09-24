import { Messenger } from '@metamask/base-controller';
import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerGetAccountAction,
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerListMultichainAccountsAction,
} from '@metamask/accounts-controller';
import { HandleSnapRequest as SnapControllerHandleRequest } from '@metamask/snaps-controllers';
import {
  KeyringControllerWithKeyringAction,
  KeyringControllerGetStateAction,
  KeyringControllerStateChangeEvent,
  KeyringControllerAddNewKeyringAction,
  KeyringControllerGetKeyringsByTypeAction,
} from '@metamask/keyring-controller';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../../controllers/preferences-controller';

type Actions =
  | AccountsControllerListMultichainAccountsAction
  | AccountsControllerGetAccountAction
  | AccountsControllerGetAccountByAddressAction
  | SnapControllerHandleRequest
  | KeyringControllerGetStateAction
  | KeyringControllerWithKeyringAction
  | KeyringControllerAddNewKeyringAction
  | KeyringControllerGetKeyringsByTypeAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerFindNetworkClientIdByChainIdAction;

type Events =
  | KeyringControllerStateChangeEvent
  | AccountsControllerAccountAddedEvent
  | AccountsControllerAccountRemovedEvent;

export type MultichainAccountServiceMessenger = ReturnType<
  typeof getMultichainAccountServiceMessenger
>;

/**
 * Get a restricted messenger for the account wallet controller. This is scoped to the
 * actions and events that this controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getMultichainAccountServiceMessenger(
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'MultichainAccountService',
    allowedEvents: [
      'KeyringController:stateChange',
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
    ],
    allowedActions: [
      'AccountsController:listMultichainAccounts',
      'AccountsController:getAccountByAddress',
      'AccountsController:getAccount',
      'SnapController:handleRequest',
      'KeyringController:getState',
      'KeyringController:withKeyring',
      'KeyringController:addNewKeyring',
      'KeyringController:getKeyringsByType',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
    ],
  });
}

type AllowedInitializationActions = PreferencesControllerGetStateAction;

type AllowedInitializationEvents = PreferencesControllerStateChangeEvent;

export type MultichainAccountServiceInitMessenger = ReturnType<
  typeof getMultichainAccountServiceInitMessenger
>;

/**
 * Get a restricted messenger for the account wallet controller. This is scoped to the
 * actions and events that this controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getMultichainAccountServiceInitMessenger(
  messenger: Messenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  return messenger.getRestricted({
    name: 'MultichainAccountServiceInit',
    allowedActions: ['PreferencesController:getState'],
    allowedEvents: ['PreferencesController:stateChange'],
  });
}
