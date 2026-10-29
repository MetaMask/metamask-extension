import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { SmartTransactionsControllerMessenger } from '@metamask/smart-transactions-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Get the messenger for the smart transactions controller. This is scoped to the
 * actions and events that the smart transactions controller is allowed to handle.
 *
 * @param messenger - The root messenger.
 * @returns The SmartTransactionsControllerMessenger.
 */
export function getSmartTransactionsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<SmartTransactionsControllerMessenger>,
    MessengerEvents<SmartTransactionsControllerMessenger>
  >,
) {
  const controllerMessenger: SmartTransactionsControllerMessenger =
    new Messenger({
      namespace: 'SmartTransactionsController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AuthenticationController:getBearerToken',
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'RemoteFeatureFlagController:getState',
      'TransactionController:getNonceLock',
      'TransactionController:getTransactions',
      'TransactionController:failTransaction',
    ],
    events: [
      'NetworkController:stateChange',
      'RemoteFeatureFlagController:stateChange',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions = never;

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
    actions: [],
  });
  return controllerInitMessenger;
}
