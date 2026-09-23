import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 229;

/**
 * Adds `hasLinkedSocialLoginProfile` to PreferencesController preferences.
 *
 * @param versionedData - The versioned data object to migrate.
 */
export const migrate = (async (versionedData) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;

  if (
    !hasProperty(data, 'PreferencesController') ||
    !isObject(data.PreferencesController)
  ) {
    return;
  }

  const preferencesController = data.PreferencesController as Record<
    string,
    unknown
  >;

  if (
    !hasProperty(preferencesController, 'preferences') ||
    !isObject(preferencesController.preferences)
  ) {
    return;
  }

  const preferences = preferencesController.preferences as Record<
    string,
    unknown
  >;

  if (!hasProperty(preferences, 'hasLinkedSocialLoginProfile')) {
    preferences.hasLinkedSocialLoginProfile = false;
  }
}) satisfies Migrate;
