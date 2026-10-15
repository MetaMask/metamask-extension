import { Messenger } from '@metamask/messenger';
import type {
  OAuthServiceGetNewRefreshTokenAction,
  OAuthServiceRenewRefreshTokenAction,
  OAuthServiceRevokeRefreshTokenAction,
} from '../../services/oauth/types';
import { RootMessenger } from '../../lib/messenger';

export type SeedlessOnboardingControllerInitMessengerActions =
  | OAuthServiceGetNewRefreshTokenAction
  | OAuthServiceRevokeRefreshTokenAction
  | OAuthServiceRenewRefreshTokenAction;

export type SeedlessOnboardingControllerInitMessenger = ReturnType<
  typeof getSeedlessOnboardingControllerInitMessenger
>;

/**
 * Restricted messenger for wiring `SeedlessOnboardingController` OAuth token
 * callbacks during wallet initialization.
 *
 * @param messenger - Root messenger used to delegate OAuth service actions.
 * @returns Init messenger scoped to OAuth refresh/revoke/renew actions.
 */
export function getSeedlessOnboardingControllerInitMessenger(
  messenger: RootMessenger<
    SeedlessOnboardingControllerInitMessengerActions,
    never
  >,
) {
  const controllerInitMessenger = new Messenger<
    'SeedlessOnboardingControllerInit',
    SeedlessOnboardingControllerInitMessengerActions,
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
