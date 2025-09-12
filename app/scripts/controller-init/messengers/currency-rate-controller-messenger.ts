import { Messenger } from '@metamask/base-controller';
import { NetworkControllerGetNetworkClientByIdAction } from '@metamask/network-controller';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';

type AllowedActions = NetworkControllerGetNetworkClientByIdAction;

export type CurrencyRateControllerMessenger = ReturnType<
  typeof getCurrencyRateControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * currency rate controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getCurrencyRateControllerMessenger(
  messenger: Messenger<AllowedActions, never>,
) {
  return messenger.getRestricted({
    name: 'CurrencyRateController',
    allowedActions: ['NetworkController:getNetworkClientById'],
    allowedEvents: [],
  });
}

type AllowedInitializationActions = PreferencesControllerGetStateAction;

export type CurrencyRateControllerInitMessenger = ReturnType<
  typeof getCurrencyRateControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the currency rate controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getCurrencyRateControllerInitMessenger(
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'CurrencyRateControllerInit',
    allowedActions: ['PreferencesController:getState'],
    allowedEvents: [],
  });
}
