import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 207;

/**
 * This migration resets `AuthenticationController.isSignedIn` to `false` so
 * that the first wallet unlock after upgrade triggers `performSignIn`, which
 * now includes automatic SRP profile pairing (ADR 0006).
 *
 * `srpSessionData` is intentionally preserved — cached tokens are still valid
 * and will be reused. The pairing call is idempotent.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  if (
    !hasProperty(versionedData.data, 'AuthenticationController') ||
    !isObject(versionedData.data.AuthenticationController)
  ) {
    return;
  }

  const authController = versionedData.data.AuthenticationController as {
    isSignedIn?: boolean;
  };

  if (
    !hasProperty(authController, 'isSignedIn') ||
    !authController.isSignedIn
  ) {
    return;
  }

  authController.isSignedIn = false;
  changedControllers.add('AuthenticationController');
}) satisfies Migrate;
