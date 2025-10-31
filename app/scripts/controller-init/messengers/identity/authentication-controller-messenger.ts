import { Messenger } from '@metamask/messenger';
import {
  KeyringControllerGetStateAction,
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import { HandleSnapRequest } from '@metamask/snaps-controllers';
import { MetaMetricsControllerGetMetaMetricsIdAction } from '../../../controllers/metametrics-controller';
import { RootMessenger } from '../../../lib/messenger';

type MessengerActions = KeyringControllerGetStateAction | HandleSnapRequest;

type MessengerEvents =
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent;

export type AuthenticationControllerMessenger = ReturnType<
  typeof getAuthenticationControllerMessenger
>;

/**
 * Get a restricted messenger for the Authentication controller. This is scoped to the
 * actions and events that the Authentication controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getAuthenticationControllerMessenger(
  messenger: RootMessenger<MessengerActions, MessengerEvents>,
) {
  const controllerMessenger = new Messenger<
    'AuthenticationController',
    MessengerActions,
    MessengerEvents,
    typeof messenger
  >({
    namespace: 'AuthenticationController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['KeyringController:getState', 'SnapController:handleRequest'],
    events: ['KeyringController:lock', 'KeyringController:unlock'],
  });
  return controllerMessenger;
}

export type AllowedInitializationActions =
  MetaMetricsControllerGetMetaMetricsIdAction;

export type AuthenticationControllerInitMessenger = ReturnType<
  typeof getAuthenticationControllerInitMessenger
>;

/**
 * Get a restricted messenger for the Authentication controller to be used during
 * initialization. This is scoped to the actions that the controller needs
 * during initialization.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getAuthenticationControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'AuthenticationController',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'AuthenticationController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['MetaMetricsController:getMetaMetricsId'],
  });
  return controllerInitMessenger;
}
