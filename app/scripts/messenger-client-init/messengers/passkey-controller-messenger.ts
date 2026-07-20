import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { PasskeyControllerMessenger } from '@metamask/passkey-controller';
import { OnboardingControllerGetStateAction } from '../../controllers/onboarding';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * passkey controller.
 *
 * The passkey controller orchestrates enrollment, unlock, password change, and
 * export flows itself, so it must be allowed to call the `KeyringController`
 * actions used by those flows.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getPasskeyControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<PasskeyControllerMessenger>,
    MessengerEvents<PasskeyControllerMessenger>
  >,
): PasskeyControllerMessenger {
  const controllerMessenger: PasskeyControllerMessenger = new Messenger({
    namespace: 'PasskeyController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'KeyringController:verifyPassword',
      'KeyringController:exportEncryptionKey',
      'KeyringController:submitEncryptionKey',
      'KeyringController:changePassword',
      'KeyringController:exportSeedPhrase',
      'KeyringController:exportAccount',
    ],
  });

  return controllerMessenger;
}

type AllowedInitializationActions = OnboardingControllerGetStateAction;

export type PasskeyControllerInitMessenger = ReturnType<
  typeof getPasskeyControllerInitMessenger
>;

/**
 * Create a messenger restricted to the actions needed during initialization of
 * the passkey controller.
 *
 * Used to supply the `getIsOnboardingCompleted` constructor callback, which
 * gates enrollment password step-up.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getPasskeyControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'PasskeyControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'PasskeyControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['OnboardingController:getState'],
  });
  return controllerInitMessenger;
}
