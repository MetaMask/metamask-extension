import { Messenger } from '@metamask/messenger';
import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerGetAccountAction,
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerListMultichainAccountsAction,
} from '@metamask/accounts-controller';
import {
  SnapControllerStateChangeEvent,
  SnapControllerGetStateAction,
  HandleSnapRequest as SnapControllerHandleRequestAction,
} from '@metamask/snaps-controllers';
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
  RemoteFeatureFlagControllerStateChangeEvent,
  RemoteFeatureFlagControllerGetStateAction,
} from '@metamask/remote-feature-flag-controller';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../../controllers/preferences-controller';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | AccountsControllerListMultichainAccountsAction
  | AccountsControllerGetAccountAction
  | AccountsControllerGetAccountByAddressAction
  | SnapControllerGetStateAction
  | SnapControllerHandleRequestAction
  | KeyringControllerGetStateAction
  | KeyringControllerWithKeyringAction
  | KeyringControllerAddNewKeyringAction
  | KeyringControllerGetKeyringsByTypeAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerFindNetworkClientIdByChainIdAction;

type Events =
  | SnapControllerStateChangeEvent
  | KeyringControllerStateChangeEvent
  | AccountsControllerAccountAddedEvent
  | AccountsControllerAccountRemovedEvent
  | RemoteFeatureFlagControllerStateChangeEvent
  | SnapControllerStateChangeEvent;

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
  messenger: RootMessenger<Actions, Events>,
) {
  const serviceMessenger = new Messenger<
    'MultichainAccountService',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'MultichainAccountService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    events: [
      'KeyringController:stateChange',
      'SnapController:stateChange',
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'RemoteFeatureFlagController:stateChange',
    ],
    actions: [
      'AccountsController:listMultichainAccounts',
      'AccountsController:getAccountByAddress',
      'AccountsController:getAccount',
      'SnapController:getState',
      'SnapController:handleRequest',
      'KeyringController:getState',
      'KeyringController:withKeyring',
      'KeyringController:addNewKeyring',
      'KeyringController:getKeyringsByType',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
    ],
  });
  return serviceMessenger;
}

type AllowedInitializationActions =
  | PreferencesControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction;

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
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const serviceInitMessenger = new Messenger<
    'MultichainAccountServiceInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'MultichainAccountServiceInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceInitMessenger,
    actions: [
      'PreferencesController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    events: ['PreferencesController:stateChange'],
  });
  return serviceInitMessenger;
}
