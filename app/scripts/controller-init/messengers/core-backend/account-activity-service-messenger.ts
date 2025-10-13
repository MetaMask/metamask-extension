import {
  type AccountActivityServiceMessenger as BackendPlatformAccountActivityServiceMessenger,
  ACCOUNT_ACTIVITY_SERVICE_ALLOWED_ACTIONS,
  ACCOUNT_ACTIVITY_SERVICE_ALLOWED_EVENTS,
} from '@metamask/core-backend';

export type AccountActivityServiceMessenger =
  BackendPlatformAccountActivityServiceMessenger;

/**
 * Get a restricted messenger for the Account Activity service. This is scoped to the
 * actions and events that the Account Activity service is allowed to handle.
 *
 * @param messenger - The main controller messenger.
 * @returns The restricted messenger.
 */
export function getAccountActivityServiceMessenger(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messenger: any, // Using any to avoid type conflicts with the main messenger
): BackendPlatformAccountActivityServiceMessenger {
  return messenger.getRestricted({
    name: 'AccountActivityService',
    allowedActions: [...ACCOUNT_ACTIVITY_SERVICE_ALLOWED_ACTIONS],
    allowedEvents: [...ACCOUNT_ACTIVITY_SERVICE_ALLOWED_EVENTS],
  });
}
