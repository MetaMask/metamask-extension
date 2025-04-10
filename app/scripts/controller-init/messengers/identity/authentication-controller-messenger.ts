import { Messenger } from '@metamask/base-controller';
import {
  KeyringControllerGetStateAction,
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import { HandleSnapRequest } from '@metamask/snaps-controllers';

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
