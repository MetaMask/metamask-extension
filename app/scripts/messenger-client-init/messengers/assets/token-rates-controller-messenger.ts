import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { TokenRatesControllerMessenger } from '@metamask/assets-controllers';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../../controllers/preferences-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the Token Rates controller. This is scoped to the
 * actions and events that the Token Rates controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getTokenRatesControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<TokenRatesControllerMessenger>,
    MessengerEvents<TokenRatesControllerMessenger>
  >,
): TokenRatesControllerMessenger {
  const controllerMessenger: TokenRatesControllerMessenger = new Messenger({
    namespace: 'TokenRatesController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'TokensController:getState',
      'NetworkController:getState',
      'NetworkEnablementController:getState',
    ],
    events: ['TokensController:stateChange', 'NetworkController:stateChange'],
  });
  return controllerMessenger;
}

type AllowedInitializationActions = PreferencesControllerGetStateAction;

type AllowedInitializationEvents = PreferencesControllerStateChangeEvent;

export type TokenRatesControllerInitMessenger = ReturnType<
  typeof getTokenRatesControllerInitMessenger
>;

/**
 * Get a restricted messenger for the token rates controller initialization.
 * This is scoped to the actions and events that the initialization is allowed
 * to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getTokenRatesControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'TokenRatesControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'TokenRatesControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['PreferencesController:getState'],
    events: ['PreferencesController:stateChange'],
  });
  return controllerInitMessenger;
}
