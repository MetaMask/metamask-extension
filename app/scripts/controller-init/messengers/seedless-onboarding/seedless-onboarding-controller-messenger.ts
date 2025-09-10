import { Messenger } from '@metamask/base-controller';
import {
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import {
  SeedlessOnboardingController,
  SeedlessOnboardingControllerGetStateAction,
  SeedlessOnboardingControllerStateChangeEvent,
} from '@metamask/seedless-onboarding-controller';

type MessengerActions = SeedlessOnboardingControllerGetStateAction;

type MessengerEvents =
  | SeedlessOnboardingControllerStateChangeEvent
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent;

export type SeedlessOnboardingControllerMessenger = ReturnType<
  typeof getSeedlessOnboardingControllerMessenger
>;

/**
 * Get a restricted messenger for the Seedless Onboarding controller. This is scoped to the
 * actions and events that the Seedless Onboarding controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSeedlessOnboardingControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
) {
  return messenger.getRestricted({
    name: SeedlessOnboardingController.name,
    allowedActions: [],
    allowedEvents: [],
  });
}
