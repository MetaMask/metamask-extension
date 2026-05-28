import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { TokenListControllerMessenger } from '@metamask/assets-controllers';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * token list controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getTokenListControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<TokenListControllerMessenger>,
    MessengerEvents<TokenListControllerMessenger>
  >,
): TokenListControllerMessenger {
  const controllerMessenger: TokenListControllerMessenger = new Messenger({
    namespace: 'TokenListController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:getNetworkClientById',
      'StorageService:getAllKeys',
      'StorageService:setItem',
      'StorageService:getItem',
    ],
    events: ['NetworkController:stateChange'],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetStateAction
  | PreferencesControllerGetStateAction;

type AllowedInitializationEvents = PreferencesControllerStateChangeEvent;

export type TokenListControllerInitMessenger = ReturnType<
  typeof getTokenListControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed during
 * initialization of the token list controller.
 *
 * @param messenger
 */
export function getTokenListControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'TokenListControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'TokenListControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'PreferencesController:getState',
    ],
    events: ['PreferencesController:stateChange'],
  });
  return controllerInitMessenger;
}
