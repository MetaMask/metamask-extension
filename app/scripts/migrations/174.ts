import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 174;

/**
 * This migration adds the default `avatarType` property to the PreferencesController preferences
 * for existing users who don't have it set yet.
 *
 * @param originalVersionedData - The original state data to migrate
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (
    hasProperty(state, 'PreferencesController') &&
    isObject(state.PreferencesController) &&
    hasProperty(state.PreferencesController, 'preferences') &&
    isObject(state.PreferencesController.preferences)
  ) {
    const preferences = state.PreferencesController.preferences as Record<
      string,
      unknown
    >;

    // Only set default avatarType if it doesn't exist
    if (
      !hasProperty(preferences, 'avatarType') ||
      preferences.avatarType === undefined
    ) {
      preferences.avatarType = 'jazzicon';
    }
  }

  return state;
}
