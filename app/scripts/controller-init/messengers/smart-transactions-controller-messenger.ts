import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { SmartTransactionsControllerMessenger } from '@metamask/smart-transactions-controller';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Get the messenger for the smart transactions controller. This is scoped to the
 * actions and events that the smart transactions controller is allowed to handle.
 *
 * @param rootMessenger - The root messenger.
 * @returns The SmartTransactionsControllerMessenger.
 */
export function getSmartTransactionsControllerMessenger(
  rootMessenger: RootMessenger,
): SmartTransactionsControllerMessenger {
  const controllerMessenger = new Messenger<
    'SmartTransactionsController',
    MessengerActions<SmartTransactionsControllerMessenger>,
    MessengerEvents<SmartTransactionsControllerMessenger>,
    RootMessenger
  >({
    namespace: 'SmartTransactionsController',
    parent: rootMessenger,
  });
  rootMessenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'ErrorReportingService:captureException',
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'RemoteFeatureFlagController:getState',
      'TransactionController:getNonceLock',
      'TransactionController:getTransactions',
      'TransactionController:updateTransaction',
    ],
    events: [
      'NetworkController:stateChange',
      'RemoteFeatureFlagController:stateChange',
    ],
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
