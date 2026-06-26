import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { SeedlessOnboardingControllerMessenger } from '@metamask/seedless-onboarding-controller';
import {
  OAuthServiceGetNewRefreshTokenAction,
  OAuthServiceRevokeRefreshTokenAction,
  OAuthServiceRenewRefreshTokenAction,
} from '../../../services/oauth/types';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the Seedless Onboarding controller. This is scoped to the
 * actions and events that the Seedless Onboarding controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSeedlessOnboardingControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<SeedlessOnboardingControllerMessenger>,
    MessengerEvents<SeedlessOnboardingControllerMessenger>
  >,
): SeedlessOnboardingControllerMessenger {
  const controllerMessenger: SeedlessOnboardingControllerMessenger =
    new Messenger({
      namespace: 'SeedlessOnboardingController',
      parent: messenger,
    });
  return controllerMessenger;
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
