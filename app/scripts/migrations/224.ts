import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 224;

/**
 * Deletes persisted `rawRemoteFeatureFlags` from RemoteFeatureFlagController.
 *
 * `@metamask/remote-feature-flag-controller` 6.0.0 stops redacting IDs from
 * `rawRemoteFeatureFlags`. Existing persisted (redacted) values must not be
 * used to recompute flags.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  if (removeRawRemoteFeatureFlags(versionedData.data)) {
    changedControllers.add('RemoteFeatureFlagController');
  }
}) satisfies Migrate;

function removeRawRemoteFeatureFlags(state: Record<string, unknown>): boolean {
  if (
    !hasProperty(state, 'RemoteFeatureFlagController') ||
    !isObject(state.RemoteFeatureFlagController)
  ) {
    return false;
  }

  if (
    !hasProperty(state.RemoteFeatureFlagController, 'rawRemoteFeatureFlags')
  ) {
    return false;
  }

  delete state.RemoteFeatureFlagController.rawRemoteFeatureFlags;
  return true;
}
