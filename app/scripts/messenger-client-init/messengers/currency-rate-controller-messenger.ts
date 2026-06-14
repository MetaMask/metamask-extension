import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { CurrencyRateMessenger } from '@metamask/assets-controllers';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * currency rate controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getCurrencyRateControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<CurrencyRateMessenger>,
    MessengerEvents<CurrencyRateMessenger>
  >,
): CurrencyRateMessenger {
  const controllerMessenger: CurrencyRateMessenger = new Messenger({
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
