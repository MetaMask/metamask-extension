import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 174;

/**
 * This migration adds the BIP-122 namespace to existing users' enabledNetworkMap
 * in the NetworkOrderController state.
 *
 * For existing users:
 * - Adds KnownCaipNamespace.Bip122 ('bip122') namespace to enabledNetworkMap if it doesn't exist
 * - Initializes it as an empty object
 *
 * For users without NetworkOrderController or enabledNetworkMap:
 * - No migration will occur
 *
 * @param originalVersionedData - The versioned extension state.
 * @returns The updated versioned extension state with Bip122 namespace added to enabledNetworkMap.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  versionedData.data = transformState(versionedData.data);

  return versionedData;
}

/**
 * Validates that a property exists and is an object
 *
 * @param obj - The object to validate
 * @param propertyName - The name of the property to check
 * @param context - The context for error messages
 * @returns True if the property exists and is an object, false otherwise
 */
function validateObjectProperty(
  obj: Record<string, unknown>,
  propertyName: string,
  context: string,
): obj is Record<string, unknown> & {
  [K in typeof propertyName]: Record<string, unknown>;
} {
  if (!hasProperty(obj, propertyName)) {
    return false;
  }

  if (!isObject(obj[propertyName])) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: ${propertyName} is type '${typeof obj[
          propertyName
        ]}', expected object in ${context}.`,
      ),
    );
    return false;
  }

  return true;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  // Validate NetworkOrderController exists
  if (!validateObjectProperty(state, 'NetworkOrderController', 'state')) {
    return state;
  }

  const networkOrderControllerState = state.NetworkOrderController;

  // Validate enabledNetworkMap exists
  if (
    !validateObjectProperty(
      networkOrderControllerState,
      'enabledNetworkMap',
      'NetworkOrderController',
    )
  ) {
    return state;
  }

  const { enabledNetworkMap } = networkOrderControllerState;

  // Check if bip122 namespace already exists
  if (hasProperty(enabledNetworkMap, 'bip122')) {
    // Already exists, no migration needed
    return state;
  }

  // Add the bip122 namespace as an empty object
  (enabledNetworkMap as Record<string, Record<string, boolean>>)['bip122'] = {};

  return state;
}
