import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { OAuthServiceMessenger } from '../../../services/oauth/types';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the OAuthService. This is scoped to the
 * actions and events that the OAuthService is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getOAuthServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<OAuthServiceMessenger>,
    MessengerEvents<OAuthServiceMessenger>
  >,
) {
  const oauthMessenger: OAuthServiceMessenger = new Messenger({
    namespace: 'OAuthService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: oauthMessenger,
    actions: [
      'SeedlessOnboardingController:getState',
      'OnboardingController:getState',
      'SeedlessOnboardingController:getAccessToken',
    ],
  });
  return oauthMessenger;
}
