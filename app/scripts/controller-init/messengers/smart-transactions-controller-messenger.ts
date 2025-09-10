import { Messenger } from '@metamask/base-controller';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';

type MessengerActions =
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetStateAction;

type MessengerEvents = NetworkControllerStateChangeEvent;

export type SmartTransactionsControllerMessenger = ReturnType<
  typeof getSmartTransactionsControllerMessenger
>;

export function getSmartTransactionsControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
) {
  return messenger.getRestricted({
    name: 'SmartTransactionsController',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
    ],
    allowedEvents: ['NetworkController:stateChange'],
  });
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
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'SmartTransactionsControllerInit',
    allowedActions: ['MetaMetricsController:trackEvent'],
    allowedEvents: [],
  });
}
