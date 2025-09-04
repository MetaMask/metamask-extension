import { Messenger } from '@metamask/base-controller';

export type OAuthServiceMessenger = ReturnType<
  typeof getOAuthServiceMessenger
>;

/**
 * Get a restricted messenger for the OAuthService. This is scoped to the
 * actions and events that the OAuthService is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getOAuthServiceMessenger(
  messenger: Messenger<never, never>,
) {
  return messenger.getRestricted({
    name: 'OAuthService',
    allowedActions: [],
    allowedEvents: [],
  });
}
