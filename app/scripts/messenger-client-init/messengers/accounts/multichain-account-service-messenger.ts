import { Messenger } from '@metamask/messenger';
import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerGetAccountAction,
  AccountsControllerGetAccountsAction,
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerListMultichainAccountsAction,
} from '@metamask/accounts-controller';
import {
  SnapControllerStateChangeEvent,
  SnapControllerGetStateAction,
  SnapControllerHandleRequestAction,
} from '@metamask/snaps-controllers';
import {
  KeyringControllerWithKeyringAction,
  KeyringControllerWithKeyringV2Action,
  KeyringControllerGetStateAction,
  KeyringControllerStateChangeEvent,
  KeyringControllerAddNewKeyringAction,
  KeyringControllerGetKeyringsByTypeAction,
  KeyringControllerCreateNewVaultAndKeychainAction,
  KeyringControllerCreateNewVaultAndRestoreAction,
} from '@metamask/keyring-controller';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import {
  RemoteFeatureFlagControllerStateChangeEvent,
  RemoteFeatureFlagControllerGetStateAction,
} from '@metamask/remote-feature-flag-controller';
import { SnapAccountServiceEnsureReadyAction } from '@metamask/snap-account-service';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../../controllers/preferences-controller';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | AccountsControllerListMultichainAccountsAction
  | AccountsControllerGetAccountAction
  | AccountsControllerGetAccountsAction
  | AccountsControllerGetAccountByAddressAction
  | SnapControllerGetStateAction
  | SnapControllerHandleRequestAction
  | KeyringControllerGetStateAction
  | KeyringControllerWithKeyringAction
  | KeyringControllerWithKeyringV2Action
  | KeyringControllerAddNewKeyringAction
  | KeyringControllerGetKeyringsByTypeAction
  | KeyringControllerCreateNewVaultAndKeychainAction
  | KeyringControllerCreateNewVaultAndRestoreAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | SnapAccountServiceEnsureReadyAction;

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
      'AccountsController:getAccounts',
      'SnapController:getState',
      'SnapController:handleRequest',
      'KeyringController:getState',
      'KeyringController:withKeyring',
      'KeyringController:withKeyringV2',
      'KeyringController:addNewKeyring',
      'KeyringController:getKeyringsByType',
      'KeyringController:createNewVaultAndKeychain',
      'KeyringController:createNewVaultAndRestore',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
      'SnapAccountService:ensureReady',
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
