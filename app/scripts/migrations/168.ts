import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 168;

/**
 * This migration migrates tokenNetworkFilter from preferences to enabledNetworkMap.
 *
 * For existing users with tokenNetworkFilter:
 * - The tokenNetworkFilter data will be migrated to enabledNetworkMap
 *
 * For users without tokenNetworkFilter:
 * - No migration will occur (enabledNetworkMap will remain unchanged)
 *
 * @param originalVersionedData - The versioned extension state.
 * @returns The updated versioned extension state with enabledNetworkMap populated from tokenNetworkFilter.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  versionedData.data = transformState(versionedData.data);

  return versionedData;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  // Check if NetworkOrderController exists
  if (!hasProperty(state, 'NetworkOrderController')) {
    console.warn(`Migration ${version}: NetworkOrderController is not present`);
    return state;
  }

  const networkOrderControllerState = state.NetworkOrderController;

  // If NetworkOrderController is not an object, log error and return state
  if (!isObject(networkOrderControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkOrderController is type '${typeof networkOrderControllerState}', expected object.`,
      ),
    );
    return state;
  }

  // Check if PreferencesController exists
  if (!hasProperty(state, 'PreferencesController')) {
    console.warn(`Migration ${version}: PreferencesController is not present`);
    return state;
  }

  const preferencesControllerState = state.PreferencesController;

  // If PreferencesController is not an object, log error and return state
  if (!isObject(preferencesControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: PreferencesController is type '${typeof preferencesControllerState}', expected object.`,
      ),
    );
    return state;
  }

  // Check if preferences exist
  if (!hasProperty(preferencesControllerState, 'preferences')) {
    console.warn(
      `Migration ${version}: preferences is not present in PreferencesController`,
    );
    return state;
  }

  const preferences = preferencesControllerState.preferences;

  // If preferences is not an object, log error and return state
  if (!isObject(preferences)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: preferences is type '${typeof preferences}', expected object.`,
      ),
    );
    return state;
  }

  // Check if tokenNetworkFilter exists
  if (!hasProperty(preferences, 'tokenNetworkFilter')) {
    console.warn(
      `Migration ${version}: tokenNetworkFilter is not present in preferences`,
    );
    return state;
  }

  const tokenNetworkFilter = preferences.tokenNetworkFilter;

  // If tokenNetworkFilter is not an object, log error and return state
  if (!isObject(tokenNetworkFilter)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: tokenNetworkFilter is type '${typeof tokenNetworkFilter}', expected object.`,
      ),
    );
    return state;
  }

  // Migrate tokenNetworkFilter to enabledNetworkMap
  networkOrderControllerState.enabledNetworkMap = { ...tokenNetworkFilter };

  return state;
}
