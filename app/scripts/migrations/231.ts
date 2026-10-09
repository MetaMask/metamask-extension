import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 231;

/**
 * Resets `AuthenticationController.needsSocialPairing` to `true`.
 *
 * The backend database was reset, so the social identifiers paired to user
 * profiles no longer exist there.
 * Setting the flag back to `true` makes the next `performSignIn` pair the
 * social identifier again, which re-sends the social login email.
 *
 * Without persisted controller state the controller default (`true`)
 * already applies, so the state is left untouched.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;

  if (
    hasProperty(data, 'AuthenticationController') &&
    isObject(data.AuthenticationController)
  ) {
    data.AuthenticationController.needsSocialPairing = true;
    changedControllers.add('AuthenticationController');
  }
}) satisfies Migrate;
