import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { ShieldControllerMessenger } from '@metamask/shield-controller';
import { AuthenticationController } from '@metamask/profile-sync-controller';
import { RootMessenger } from '../../../lib/messenger';

type AllowedActions = MessengerActions<ShieldControllerMessenger>;

type AllowedEvents = MessengerEvents<ShieldControllerMessenger>;

export type ShieldControllerMessengerType = ReturnType<
  typeof getShieldControllerMessenger
>;

/**
 * Get a restricted messenger for the Shield controller. This is scoped to the
 * actions and events that the Shield controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getShieldControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
): ShieldControllerMessenger {
  const controllerMessenger = new Messenger<
    'ShieldController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'ShieldController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'SignatureController:stateChange',
      'TransactionController:stateChange',
    ],
  });
  return controllerMessenger;
}

type InitActions =
  AuthenticationController.AuthenticationControllerGetBearerToken;
type InitEvents = never;

export function getShieldControllerInitMessenger(
  messenger: RootMessenger<InitActions, InitEvents>,
) {
  const controllerInitMessenger = new Messenger<
    'ShieldControllerInit',
    InitActions,
    InitEvents,
    typeof messenger
  >({
    namespace: 'ShieldControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['AuthenticationController:getBearerToken'],
  });
  return controllerInitMessenger;
}

export type ShieldControllerInitMessenger = ReturnType<
  typeof getShieldControllerInitMessenger
>;
