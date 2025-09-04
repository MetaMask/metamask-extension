import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { ShieldControllerMessenger } from '@metamask/shield-controller';
import { AuthenticationController } from '@metamask/profile-sync-controller';

type MessengerActions =
  ShieldControllerMessenger extends RestrictedMessenger<
    never,
    infer Actions,
    never,
    never,
    never
  >
    ? Actions
    : never;
type MessengerEvents =
  ShieldControllerMessenger extends RestrictedMessenger<
    never,
    never,
    infer Events,
    never,
    never
  >
    ? Events
    : never;

/**
 * Get a restricted messenger for the Shield controller. This is scoped to the
 * actions and events that the Shield controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getShieldControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
): ShieldControllerMessenger {
  return messenger.getRestricted({
    name: 'ShieldController',
    allowedActions: [],
    allowedEvents: ['TransactionController:stateChange'],
  });
}

type InitActions =
  AuthenticationController.AuthenticationControllerGetBearerToken;
type InitEvents = never;

export function getShieldControllerInitMessenger(
  messenger: Messenger<InitActions, InitEvents>,
) {
  return messenger.getRestricted({
    name: 'ShieldControllerInit',
    allowedEvents: [],
    allowedActions: ['AuthenticationController:getBearerToken'],
  });
}

export type ShieldControllerInitMessenger = ReturnType<
  typeof getShieldControllerInitMessenger
>;
