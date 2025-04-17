import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerListAccountsAction,
} from '@metamask/accounts-controller';
import { Messenger } from '@metamask/base-controller';
import { TransactionControllerTransactionConfirmedEvent } from '@metamask/transaction-controller';
import {
  KeyringControllerUnlockEvent,
  KeyringControllerLockEvent,
} from '@metamask/keyring-controller';

import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';

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
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'DeFiPositionsController',
    allowedActions: ['AccountsController:listAccounts'],
    allowedEvents: [
      'KeyringController:unlock',
      'KeyringController:lock',
      'TransactionController:transactionConfirmed',
      'AccountsController:accountAdded',
    ],
  });
}

export type DeFiPositionsControllerInitMessenger = ReturnType<
  typeof getDeFiPositionsControllerInitMessenger
>;

export function getDeFiPositionsControllerInitMessenger(
  messenger: Messenger<RemoteFeatureFlagControllerGetStateAction, never>,
) {
  return messenger.getRestricted({
    name: 'DeFiPositionsControllerInit',
    allowedEvents: [],
    allowedActions: ['RemoteFeatureFlagController:getState'],
  });
}
