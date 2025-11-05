import { Messenger } from '@metamask/messenger';
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
import {
  TransactionControllerTransactionConfirmedEvent,
  TransactionControllerUnapprovedTransactionAddedEvent,
} from '@metamask/transaction-controller';
import { KeyringControllerUnlockEvent } from '@metamask/keyring-controller';
import { RootMessenger } from '../../lib/messenger';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';

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
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const accountTrackerControllerMessenger = new Messenger<
    'AccountTrackerController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'AccountTrackerController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: accountTrackerControllerMessenger,
    actions: [
      'AccountsController:getSelectedAccount',
      'AccountsController:listAccounts',
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'PreferencesController:getState',
    ],
    events: [
      'AccountsController:selectedEvmAccountChange',
      'TransactionController:transactionConfirmed',
      'TransactionController:unapprovedTransactionAdded',
      'NetworkController:networkAdded',
      'KeyringController:unlock',
    ],
  });
  return accountTrackerControllerMessenger;
}

type AllowedInitializationActions =
  | RemoteFeatureFlagControllerGetStateAction
  | PreferencesControllerGetStateAction;

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
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const accountTrackerControllerInitMessenger = new Messenger<
    'AccountTrackerControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'AccountTrackerControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: accountTrackerControllerInitMessenger,
    actions: [
      'RemoteFeatureFlagController:getState',
      'PreferencesController:getState',
    ],
    events: ['NetworkController:networkDidChange'],
  });
  return accountTrackerControllerInitMessenger;
}
