import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerGetStateAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerGetAccountAction,
  AccountsControllerSelectedEvmAccountChangeEvent,
} from '@metamask/accounts-controller';
import {
  TokensControllerGetStateAction,
  TokensControllerStateChangeEvent,
} from '@metamask/assets-controllers';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../../controllers/preferences-controller';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | TokensControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetStateAction
  | AccountsControllerGetAccountAction
  | AccountsControllerGetSelectedAccountAction;

type Events =
  | NetworkControllerStateChangeEvent
  | AccountsControllerSelectedEvmAccountChangeEvent
  | PreferencesControllerStateChangeEvent
  | TokensControllerStateChangeEvent;

export type TokenRatesControllerMessenger = ReturnType<
  typeof getTokenRatesControllerMessenger
>;

/**
 * Get a restricted messenger for the Token Rates controller. This is scoped to the
 * actions and events that the Token Rates controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getTokenRatesControllerMessenger(
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'TokenRatesController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'TokenRatesController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'TokensController:getState',
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'AccountsController:getAccount',
      'AccountsController:getSelectedAccount',
    ],
    events: [
      'NetworkController:stateChange',
      'AccountsController:selectedEvmAccountChange',
      'PreferencesController:stateChange',
      'TokensController:stateChange',
    ],
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
