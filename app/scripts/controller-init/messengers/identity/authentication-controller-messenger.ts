import { Messenger } from '@metamask/base-controller';
import {
  KeyringControllerGetStateAction,
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import { HandleSnapRequest } from '@metamask/snaps-controllers';
import { MetaMetricsControllerGetMetaMetricsIdAction } from '../../../controllers/metametrics-controller.ts';

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
  messenger: Messenger<MessengerActions, MessengerEvents>,
) {
  return messenger.getRestricted({
    name: 'AuthenticationController',
    allowedActions: [
      'KeyringController:getState',
      'SnapController:handleRequest',
    ],
    allowedEvents: ['KeyringController:lock', 'KeyringController:unlock'],
  });
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
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'AuthenticationController',
    allowedActions: ['MetaMetricsController:getMetaMetricsId'],
    allowedEvents: [],
  });
}
