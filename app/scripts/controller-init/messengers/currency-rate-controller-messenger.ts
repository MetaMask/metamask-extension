import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions =
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetStateAction;

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
  messenger: RootMessenger<AllowedActions, never>,
) {
  const controllerMessenger = new Messenger<
    'CurrencyRateController',
    AllowedActions,
    never,
    typeof messenger
  >({
    namespace: 'CurrencyRateController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
    ],
  });
  return controllerMessenger;
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
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'CurrencyRateControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'CurrencyRateControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['PreferencesController:getState'],
  });
  return controllerInitMessenger;
}
