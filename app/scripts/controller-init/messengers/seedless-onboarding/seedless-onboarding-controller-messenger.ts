import { Messenger } from '@metamask/base-controller';
import {
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import {
  SeedlessOnboardingControllerGetStateAction,
  SeedlessOnboardingControllerStateChangeEvent,
} from '@metamask/seedless-onboarding-controller';
import {
  OAuthServiceGetNewRefreshTokenAction,
  OAuthServiceRevokeAndGetNewRefreshTokenAction,
} from '../../../services/oauth/types';

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
    name: 'SeedlessOnboardingController',
    allowedActions: [],
    allowedEvents: ['KeyringController:lock', 'KeyringController:unlock'],
  });
}

type InitActions =
  | OAuthServiceGetNewRefreshTokenAction
  | OAuthServiceRevokeAndGetNewRefreshTokenAction;

export type SeedlessOnboardingControllerInitMessenger = ReturnType<
  typeof getSeedlessOnboardingControllerInitMessenger
>;

/**
 * Get a restricted messenger for the seedless onboarding controller init. This
 * is scoped to the actions and events that the seedless onboarding controller
 * init is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSeedlessOnboardingControllerInitMessenger(
  messenger: Messenger<InitActions, never>,
) {
  return messenger.getRestricted({
    name: 'SeedlessOnboardingControllerInit',
    allowedEvents: [],
    allowedActions: [
      'OAuthService:getNewRefreshToken',
      'OAuthService:revokeAndGetNewRefreshToken',
    ],
  });
}
