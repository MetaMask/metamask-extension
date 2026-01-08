import { Messenger } from '@metamask/messenger';
import type {
  TransactionControllerGetNonceLockAction,
  TransactionControllerGetTransactionsAction,
  TransactionControllerUpdateTransactionAction,
} from '@metamask/transaction-controller';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';
import { RootMessenger } from '../../lib/messenger';

type MessengerActions =
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetStateAction
  | TransactionControllerGetNonceLockAction
  | TransactionControllerGetTransactionsAction
  | TransactionControllerUpdateTransactionAction;

type MessengerEvents = NetworkControllerStateChangeEvent;

export type SmartTransactionsControllerMessenger = ReturnType<
  typeof getSmartTransactionsControllerMessenger
>;

export function getSmartTransactionsControllerMessenger(
  messenger: RootMessenger<MessengerActions, MessengerEvents>,
) {
  const controllerMessenger = new Messenger<
    'SmartTransactionsController',
    MessengerActions,
    MessengerEvents,
    typeof messenger
  >({
    namespace: 'SmartTransactionsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'TransactionController:getNonceLock',
      'TransactionController:getTransactions',
      'TransactionController:updateTransaction',
    ],
    events: ['NetworkController:stateChange'],
  });
  return controllerMessenger;
}

export type AllowedInitializationActions =
  MetaMetricsControllerTrackEventAction;

export type SmartTransactionsControllerInitMessenger = ReturnType<
  typeof getSmartTransactionsControllerInitMessenger
>;

/**
 * Get a restricted messenger for initializing the smart transactions controller.
 * This is scoped to the actions that are allowed during controller
 * initialization.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getSmartTransactionsControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'SmartTransactionsControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'SmartTransactionsControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['MetaMetricsController:trackEvent'],
  });
  return controllerInitMessenger;
}
