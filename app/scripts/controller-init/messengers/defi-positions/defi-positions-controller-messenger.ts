import { Messenger } from '@metamask/base-controller';
import { TransactionControllerTransactionConfirmedEvent } from '@metamask/transaction-controller';
import { KeyringControllerLockEvent } from '@metamask/keyring-controller';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller';

type AllowedActions =
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction;

type AllowedEvents =
  | KeyringControllerLockEvent
  | TransactionControllerTransactionConfirmedEvent
  | AccountTreeControllerSelectedAccountGroupChangeEvent;

export type DeFiPositionsControllerMessenger = ReturnType<
  typeof getDeFiPositionsControllerMessenger
>;

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
    allowedActions: [
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
    ],
    allowedEvents: [
      'KeyringController:lock',
      'TransactionController:transactionConfirmed',
      'AccountTreeController:selectedAccountGroupChange',
    ],
  });
}

type AllowedInitializationActions =
  | RemoteFeatureFlagControllerGetStateAction
  | MetaMetricsControllerTrackEventAction;

export type DeFiPositionsControllerInitMessenger = ReturnType<
  typeof getDeFiPositionsControllerInitMessenger
>;

export function getDeFiPositionsControllerInitMessenger(
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'DeFiPositionsControllerInit',
    allowedActions: [
      'RemoteFeatureFlagController:getState',
      'MetaMetricsController:trackEvent',
    ],
    allowedEvents: [],
  });
}
