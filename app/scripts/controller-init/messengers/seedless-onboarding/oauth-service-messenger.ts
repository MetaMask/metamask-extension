import { Messenger } from '@metamask/messenger';
import { OAuthServiceAction } from '../../../services/oauth/types';
import { RootMessenger } from '..';

export type OAuthServiceMessenger = ReturnType<typeof getOAuthServiceMessenger>;

/**
 * Get a restricted messenger for the OAuthService. This is scoped to the
 * actions and events that the OAuthService is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getOAuthServiceMessenger(
  messenger: RootMessenger<OAuthServiceAction, never>,
) {
  const oauthMessenger = new Messenger<
    'OAuthService',
    OAuthServiceAction,
    never,
    typeof messenger
  >({
    namespace: 'OAuthService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: oauthMessenger,
    actions: ['SeedlessOnboardingController:getState'],
  });
  return oauthMessenger;
}
