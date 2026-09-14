import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type { TransactionPayControllerMessenger } from '@metamask/transaction-pay-controller';
import type { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import type { KeyringControllerSignEip7702AuthorizationAction } from '@metamask/keyring-controller';
import type { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import type { MoneyAccountControllerGetMoneyAccountAction } from '@metamask/money-account-controller';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type {
  TransactionControllerAddTransactionBatchAction,
  TransactionControllerGetNonceLockAction,
  TransactionControllerGetStateAction,
  TransactionControllerIsAtomicBatchSupportedAction,
  TransactionControllerUnapprovedTransactionAddedEvent,
  TransactionControllerUpdateTransactionAction,
} from '@metamask/transaction-controller';
import type { RootMessenger } from '../../lib/messenger';

export function getTransactionPayControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<TransactionPayControllerMessenger>,
    MessengerEvents<TransactionPayControllerMessenger>
  >,
): TransactionPayControllerMessenger {
  const controllerMessenger: TransactionPayControllerMessenger = new Messenger({
    namespace: 'TransactionPayController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountTrackerController:getState',
      'AssetsController:getStateForTransactionPay',
      'CurrencyRateController:getState',
      'GasFeeController:getState',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
      'NetworkController:getNetworkConfigurationByChainId',
      'RemoteFeatureFlagController:getState',
      'TokenBalancesController:getState',
      'TokenRatesController:getState',
      'TokensController:getState',
      'TransactionController:estimateGas',
      'TransactionController:estimateGasBatch',
      'TransactionController:getGasFeeTokens',
      'TransactionController:getState',
      'TransactionController:updateTransaction',
      'KeyringController:getState',
      'KeyringController:signTypedMessage',
      'RampsController:getOrder',
      'RampsController:getQuotes',
      'SentinelApiService:simulateTransactions',
    ],
    events: [
      'AssetsController:stateChange',
      'CurrencyRateController:stateChange',
      'TokenRatesController:stateChange',
      'TokensController:stateChange',
      'TransactionController:stateChange',
      'TransactionController:unapprovedTransactionAdded',
    ],
  });

  return controllerMessenger;
}

type InitMessengerActions =
  | AccountsControllerGetSelectedAccountAction
  | DelegationControllerSignDelegationAction
  | KeyringControllerSignEip7702AuthorizationAction
  | TransactionControllerGetNonceLockAction
  | TransactionControllerGetStateAction
  | TransactionControllerIsAtomicBatchSupportedAction
  | TransactionControllerUpdateTransactionAction
  | MoneyAccountControllerGetMoneyAccountAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetNetworkClientByIdAction
  | RemoteFeatureFlagControllerGetStateAction
  | TransactionControllerAddTransactionBatchAction;

type InitMessengerEvents = TransactionControllerUnapprovedTransactionAddedEvent;

export type TransactionPayControllerInitMessenger = ReturnType<
  typeof getTransactionPayControllerInitMessenger
>;

export function getTransactionPayControllerInitMessenger(
  messenger: RootMessenger<InitMessengerActions, InitMessengerEvents>,
) {
  const controllerInitMessenger = new Messenger<
    'TransactionPayControllerInit',
    InitMessengerActions,
    InitMessengerEvents,
    typeof messenger
  >({
    namespace: 'TransactionPayControllerInit',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'AccountsController:getSelectedAccount',
      'DelegationController:signDelegation',
      'KeyringController:signEip7702Authorization',
      'MoneyAccountController:getMoneyAccount',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
      'RemoteFeatureFlagController:getState',
      'TransactionController:addTransactionBatch',
      'TransactionController:getNonceLock',
      'TransactionController:getState',
      'TransactionController:isAtomicBatchSupported',
      'TransactionController:updateTransaction',
    ],
    events: ['TransactionController:unapprovedTransactionAdded'],
  });

  return controllerInitMessenger;
}
