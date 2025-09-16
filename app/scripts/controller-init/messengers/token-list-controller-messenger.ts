import { Messenger } from '@metamask/base-controller';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';

type AllowedActions = NetworkControllerGetNetworkClientByIdAction;

type AllowedEvents = NetworkControllerStateChangeEvent;

export type TokenListControllerMessenger = ReturnType<
  typeof getTokenListControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * token list controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getTokenListControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'TokenListController',
    allowedActions: ['NetworkController:getNetworkClientById'],
    allowedEvents: ['NetworkController:stateChange'],
  });
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
  messenger: Messenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  return messenger.getRestricted({
    name: 'TokenListControllerInit',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'PreferencesController:getState',
    ],
    allowedEvents: ['PreferencesController:stateChange'],
  });
}
