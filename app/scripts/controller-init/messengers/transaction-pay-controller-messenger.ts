import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type { TransactionPayControllerMessenger } from '@metamask/transaction-pay-controller';
import type { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import type { KeyringControllerSignEip7702AuthorizationAction } from '@metamask/keyring-controller';
import type { RootMessenger } from '../../lib/messenger';

export function getTransactionPayControllerMessenger(
  messenger: RootMessenger,
): TransactionPayControllerMessenger {
  const controllerMessenger = new Messenger<
    'TransactionPayController',
    MessengerActions<TransactionPayControllerMessenger>,
    MessengerEvents<TransactionPayControllerMessenger>,
    typeof messenger
  >({
    namespace: 'TransactionPayController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountTrackerController:getState',
      'BridgeController:fetchQuotes',
      'BridgeStatusController:submitTx',
      'CurrencyRateController:getState',
      'GasFeeController:getState',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
      'RemoteFeatureFlagController:getState',
      'TokenBalancesController:getState',
      'TokenListController:getState',
      'TokenRatesController:getState',
      'TokensController:getState',
      'TransactionController:getGasFeeTokens',
      'TransactionController:getState',
      'TransactionController:updateTransaction',
    ],
    events: [
      'BridgeStatusController:stateChange',
      'TransactionController:stateChange',
      'TransactionController:unapprovedTransactionAdded',
    ],
  });

  return controllerMessenger;
}

type InitMessengerActions =
  | DelegationControllerSignDelegationAction
  | KeyringControllerSignEip7702AuthorizationAction;

type InitMessengerEvents = never;

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
      'DelegationController:signDelegation',
      'KeyringController:signEip7702Authorization',
    ],
    events: [],
  });

  return controllerInitMessenger;
}
