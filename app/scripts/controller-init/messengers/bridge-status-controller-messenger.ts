import { Messenger } from '@metamask/messenger';
import type { AccountsControllerGetAccountByAddressAction } from '@metamask/accounts-controller';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import {
  type TransactionControllerGetStateAction,
  TransactionControllerTransactionConfirmedEvent,
  TransactionControllerTransactionFailedEvent,
} from '@metamask/transaction-controller';
import type {
  BridgeBackgroundAction,
  BridgeControllerAction,
} from '@metamask/bridge-controller';
import type { GetGasFeeState } from '@metamask/gas-fee-controller';
import { MultichainTransactionsControllerTransactionConfirmedEvent } from '@metamask/multichain-transactions-controller';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions =
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | HandleSnapRequest
  | TransactionControllerGetStateAction
  | BridgeControllerAction<BridgeBackgroundAction.TRACK_METAMETRICS_EVENT>
  | BridgeControllerAction<BridgeBackgroundAction.STOP_POLLING_FOR_QUOTES>
  | GetGasFeeState
  | AccountsControllerGetAccountByAddressAction
  | RemoteFeatureFlagControllerGetStateAction;

type AllowedEvents =
  | MultichainTransactionsControllerTransactionConfirmedEvent
  | TransactionControllerTransactionFailedEvent
  | TransactionControllerTransactionConfirmedEvent;

export type BridgeStatusControllerMessenger = ReturnType<
  typeof getBridgeStatusControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * bridge status controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getBridgeStatusControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const controllerMessenger = new Messenger<
    'BridgeStatusController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'BridgeStatusController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:getAccountByAddress',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getState',
      'BridgeController:trackUnifiedSwapBridgeEvent',
      'BridgeController:stopPollingForQuotes',
      'GasFeeController:getState',
      'SnapController:handleRequest',
      'TransactionController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    events: [
      'MultichainTransactionsController:transactionConfirmed',
      'TransactionController:transactionFailed',
      'TransactionController:transactionConfirmed',
    ],
  });
  return controllerMessenger;
}
