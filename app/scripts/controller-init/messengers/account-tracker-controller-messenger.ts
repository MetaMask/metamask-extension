import { Messenger } from '@metamask/base-controller';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkAddedEvent,
  NetworkControllerNetworkDidChangeEvent,
} from '@metamask/network-controller';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerListAccountsAction,
  AccountsControllerSelectedEvmAccountChangeEvent,
} from '@metamask/accounts-controller';
import { PreferencesControllerGetStateAction } from '@metamask/preferences-controller';
import {
  TransactionControllerTransactionConfirmedEvent,
  TransactionControllerUnapprovedTransactionAddedEvent,
} from '@metamask/transaction-controller';
import { KeyringControllerUnlockEvent } from '@metamask/keyring-controller';
import { PreferencesControllerGetStateAction as InternalPreferencesControllerGetStateAction } from '../../controllers/preferences-controller';

export type AccountTrackerControllerMessenger = ReturnType<
  typeof getAccountTrackerControllerMessenger
>;

type AllowedActions =
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerListAccountsAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetStateAction
  | PreferencesControllerGetStateAction;

type AllowedEvents =
  | AccountsControllerSelectedEvmAccountChangeEvent
  | TransactionControllerTransactionConfirmedEvent
  | TransactionControllerUnapprovedTransactionAddedEvent
  | NetworkControllerNetworkAddedEvent
  | KeyringControllerUnlockEvent;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * account tracker controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAccountTrackerControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'AccountTrackerController',
    allowedActions: [
      'AccountsController:getSelectedAccount',
      'AccountsController:listAccounts',
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'PreferencesController:getState',
    ],
    allowedEvents: [
      'AccountsController:selectedEvmAccountChange',
      'TransactionController:transactionConfirmed',
      'TransactionController:unapprovedTransactionAdded',
      'NetworkController:networkAdded',
      'KeyringController:unlock',
    ],
  });
}

type AllowedInitializationActions =
  | RemoteFeatureFlagControllerGetStateAction
  | InternalPreferencesControllerGetStateAction;

type AllowedInitializationEvents = NetworkControllerNetworkDidChangeEvent;

export type AccountTrackerControllerInitMessenger = ReturnType<
  typeof getAccountTrackerControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the account tracker controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAccountTrackerControllerInitMessenger(
  messenger: Messenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  return messenger.getRestricted({
    name: 'AccountTrackerControllerInit',
    allowedActions: [
      'RemoteFeatureFlagController:getState',
      'PreferencesController:getState',
    ],
    allowedEvents: ['NetworkController:networkDidChange'],
  });
}
