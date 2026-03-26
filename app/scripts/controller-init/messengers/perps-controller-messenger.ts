import { Messenger } from '@metamask/messenger';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import {
  KeyringControllerGetStateAction,
  KeyringControllerSignTypedMessageAction,
} from '@metamask/keyring-controller';
import {
  NetworkControllerGetStateAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerFindNetworkClientIdByChainIdAction,
} from '@metamask/network-controller';
import type { AuthenticationController } from '@metamask/profile-sync-controller';
import {
  RemoteFeatureFlagControllerGetStateAction,
  RemoteFeatureFlagControllerStateChangeEvent,
} from '@metamask/remote-feature-flag-controller';
import { TransactionControllerAddTransactionAction } from '@metamask/transaction-controller';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions =
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | KeyringControllerGetStateAction
  | KeyringControllerSignTypedMessageAction
  | TransactionControllerAddTransactionAction
  | RemoteFeatureFlagControllerGetStateAction
  | AccountTreeControllerGetAccountsFromSelectedAccountGroupAction
  | AuthenticationController.AuthenticationControllerGetBearerTokenAction;

type AllowedEvents =
  | RemoteFeatureFlagControllerStateChangeEvent
  | AccountTreeControllerSelectedAccountGroupChangeEvent;

export type PerpsControllerMessenger = ReturnType<
  typeof getPerpsControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * PerpsController.
 *
 * @param messenger - The root messenger used to create the restricted
 * messenger.
 * @returns A restricted messenger for the PerpsController.
 */
export function getPerpsControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const perpsControllerMessenger = new Messenger<
    'PerpsController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'PerpsController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: perpsControllerMessenger,
    actions: [
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
      'KeyringController:getState',
      'KeyringController:signTypedMessage',
      'TransactionController:addTransaction',
      'RemoteFeatureFlagController:getState',
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      'AuthenticationController:getBearerToken',
    ],
    events: [
      'RemoteFeatureFlagController:stateChange',
      'AccountTreeController:selectedAccountGroupChange',
    ],
  });

  return perpsControllerMessenger;
}
