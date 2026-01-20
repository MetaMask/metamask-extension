import { Messenger } from '@metamask/messenger';
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
  OAuthServiceRevokeRefreshTokenAction,
  OAuthServiceRenewRefreshTokenAction,
} from '../../../services/oauth/types';
import { RootMessenger } from '../../../lib/messenger';

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
  messenger: RootMessenger<MessengerActions, MessengerEvents>,
) {
  return new Messenger<
    'SeedlessOnboardingController',
    MessengerActions,
    MessengerEvents,
    typeof messenger
  >({
    namespace: 'SeedlessOnboardingController',
    parent: messenger,
  });
}

type InitActions =
  | OAuthServiceGetNewRefreshTokenAction
  | OAuthServiceRevokeRefreshTokenAction
  | OAuthServiceRenewRefreshTokenAction;

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
  messenger: RootMessenger<InitActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'SeedlessOnboardingControllerInit',
    InitActions,
    never,
    typeof messenger
  >({
    namespace: 'SeedlessOnboardingControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'OAuthService:getNewRefreshToken',
      'OAuthService:revokeRefreshToken',
      'OAuthService:renewRefreshToken',
    ],
  });
  return controllerInitMessenger;
}
