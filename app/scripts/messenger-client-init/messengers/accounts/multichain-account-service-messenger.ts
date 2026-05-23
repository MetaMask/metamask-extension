import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type { MultichainAccountServiceMessenger } from '@metamask/multichain-account-service';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../../controllers/preferences-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the account wallet controller. This is scoped to the
 * actions and events that this controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getMultichainAccountServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<MultichainAccountServiceMessenger>,
    MessengerEvents<MultichainAccountServiceMessenger>
  >,
) {
  const serviceMessenger: MultichainAccountServiceMessenger = new Messenger({
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
      'KeyringController:addNewKeyring',
      'KeyringController:getKeyringsByType',
      'KeyringController:createNewVaultAndKeychain',
      'KeyringController:createNewVaultAndRestore',
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
