import { Messenger } from '@metamask/base-controller';
import type {
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerGetSelectedMultichainAccountAction,
} from '@metamask/accounts-controller';
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

type AllowedActions =
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | AccountsControllerGetSelectedMultichainAccountAction
  | HandleSnapRequest
  | TransactionControllerGetStateAction
  | BridgeControllerAction<BridgeBackgroundAction.GET_BRIDGE_ERC20_ALLOWANCE>
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
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'BridgeStatusController',
    allowedActions: [
      'AccountsController:getSelectedMultichainAccount',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getState',
      'BridgeController:getBridgeERC20Allowance',
      'BridgeController:trackUnifiedSwapBridgeEvent',
      'BridgeController:stopPollingForQuotes',
      'GasFeeController:getState',
      'AccountsController:getAccountByAddress',
      'SnapController:handleRequest',
      'TransactionController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    allowedEvents: [
      'MultichainTransactionsController:transactionConfirmed',
      'TransactionController:transactionFailed',
      'TransactionController:transactionConfirmed',
    ],
  });
}
