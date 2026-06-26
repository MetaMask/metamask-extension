import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { ShieldControllerMessenger } from '@metamask/shield-controller';
import { AuthenticationController } from '@metamask/profile-sync-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the Shield controller. This is scoped to the
 * actions and events that the Shield controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getShieldControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<ShieldControllerMessenger>,
    MessengerEvents<ShieldControllerMessenger>
  >,
) {
  const controllerMessenger: ShieldControllerMessenger = new Messenger({
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
  AuthenticationController.AuthenticationControllerGetBearerTokenAction;

type InitEvents = never;

export type ShieldControllerInitMessenger = ReturnType<
  typeof getShieldControllerInitMessenger
>;

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
