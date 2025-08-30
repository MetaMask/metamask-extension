import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 174;

/**
 * This migration adds `avatarType` to PreferencesController preferences
 * If useBlockie was set to true, sets avatarType to 'blockies', otherwise sets it to 'maskicon'
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
    isObject(state.PreferencesController)
  ) {
    const preferencesController = state.PreferencesController as Record<
      string,
      unknown
    >;
    const useBlockie = preferencesController.useBlockie as boolean;

    // Check if preferences object exists
    if (
      hasProperty(preferencesController, 'preferences') &&
      isObject(preferencesController.preferences)
    ) {
      const preferences = preferencesController.preferences as Record<
        string,
        unknown
      >;

      // Only set default avatarType if it doesn't exist
      if (
        !hasProperty(preferences, 'avatarType') ||
        preferences.avatarType === undefined
      ) {
        // Respect existing useBlockie setting, otherwise default to 'maskicon'
        preferences.avatarType = useBlockie === true ? 'blockies' : 'maskicon';
      }
    }
  }

  return state;
}
