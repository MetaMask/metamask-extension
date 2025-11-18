import { Messenger } from '@metamask/messenger';
import { OAuthServiceAction } from '../../../services/oauth/types';
import { RootMessenger } from '../../../lib/messenger';
import { OnboardingControllerGetStateAction } from '../../../controllers/onboarding';

type AllowedActions = OAuthServiceAction | OnboardingControllerGetStateAction;

export type OAuthServiceMessenger = ReturnType<typeof getOAuthServiceMessenger>;

/**
 * Get a restricted messenger for the OAuthService. This is scoped to the
 * actions and events that the OAuthService is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getOAuthServiceMessenger(
  messenger: RootMessenger<AllowedActions, never>,
) {
  const oauthMessenger = new Messenger<
    'OAuthService',
    AllowedActions,
    never,
    typeof messenger
  >({
    namespace: 'OAuthService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: oauthMessenger,
    actions: [
      'SeedlessOnboardingController:getState',
      'OnboardingController:getState',
    ],
  });
  return oauthMessenger;
}
