import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerListAccountsAction,
} from '@metamask/accounts-controller';
import { Messenger } from '@metamask/messenger';
import { TransactionControllerTransactionConfirmedEvent } from '@metamask/transaction-controller';
import {
  KeyringControllerUnlockEvent,
  KeyringControllerLockEvent,
} from '@metamask/keyring-controller';

import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller';
import { RootMessenger } from '../../../lib/messenger';

export type DefiPositionsControllerMessenger = ReturnType<
  typeof getDeFiPositionsControllerMessenger
>;

type AllowedActions = AccountsControllerListAccountsAction;

type AllowedEvents =
  | KeyringControllerUnlockEvent
  | KeyringControllerLockEvent
  | TransactionControllerTransactionConfirmedEvent
  | AccountsControllerAccountAddedEvent;

/**
 * Get a restricted messenger for the Defi Positions controller. This is scoped to the
 * actions and events that the Defi Positions controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getDeFiPositionsControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const controllerMessenger = new Messenger<
    'DeFiPositionsController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'DeFiPositionsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['AccountsController:listAccounts'],
    events: [
      'KeyringController:unlock',
      'KeyringController:lock',
      'TransactionController:transactionConfirmed',
      'AccountsController:accountAdded',
    ],
  });
  return controllerMessenger;
}

export type AllowedInitializationActions =
  | RemoteFeatureFlagControllerGetStateAction
  | MetaMetricsControllerTrackEventAction;

export type DeFiPositionsControllerInitMessenger = ReturnType<
  typeof getDeFiPositionsControllerInitMessenger
>;

export function getDeFiPositionsControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'DeFiPositionsControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'DeFiPositionsControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'RemoteFeatureFlagController:getState',
      'MetaMetricsController:trackEvent',
    ],
  });
  return controllerInitMessenger;
}
