import { cloneDeep } from 'lodash';
import { hasProperty, isObject, parseCaipChainId } from '@metamask/utils';
import { formatChainIdToCaip } from '@metamask/bridge-controller';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 171;

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

/**
 * Creates enabledNetworkMap from tokenNetworkFilter for EVM networks
 *
 * @param tokenNetworkFilter - The token network filter object
 * @returns The enabled network map for EVM networks
 */
function createEvmEnabledNetworkMap(
  tokenNetworkFilter: Record<string, boolean>,
): Record<string, Record<string, boolean>> {
  const caipChainId = formatChainIdToCaip(Object.keys(tokenNetworkFilter)[0]);

  const { namespace: chainNamespace } = parseCaipChainId(caipChainId);

  const enabledNetworkMap: Record<string, Record<string, boolean>> = {
    [chainNamespace]: {
      ...tokenNetworkFilter,
    },
  };

  return enabledNetworkMap;
}

/**
 * Creates enabledNetworkMap for non-EVM networks
 *
 * @param selectedMultichainNetworkChainId - The selected multichain network chain ID
 * @returns The enabled network map for non-EVM networks
 */
function createNonEvmEnabledNetworkMap(
  selectedMultichainNetworkChainId: string,
): Record<string, Record<string, boolean>> {
  const caipChainId = formatChainIdToCaip(selectedMultichainNetworkChainId);
  const { namespace: chainNamespace } = parseCaipChainId(caipChainId);

  const enabledNetworkMap = {
    [chainNamespace]: {
      [selectedMultichainNetworkChainId]: true,
    },
  };

  return enabledNetworkMap;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  // Validate NetworkOrderController
  if (!validateObjectProperty(state, 'NetworkOrderController', 'state')) {
    return state;
  }

  const networkOrderControllerState = state.NetworkOrderController;

  // Validate PreferencesController
  if (!validateObjectProperty(state, 'PreferencesController', 'state')) {
    return state;
  }

  const preferencesControllerState = state.PreferencesController;

  // Validate preferences
  if (
    !validateObjectProperty(
      preferencesControllerState,
      'preferences',
      'PreferencesController',
    )
  ) {
    return state;
  }

  const { preferences } = preferencesControllerState;

  // Check if tokenNetworkFilter exists (optional for this migration)
  if (!hasProperty(preferences, 'tokenNetworkFilter')) {
    return state;
  }

  const { tokenNetworkFilter } = preferences;

  // Validate tokenNetworkFilter
  if (!isObject(tokenNetworkFilter)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: tokenNetworkFilter is type '${typeof tokenNetworkFilter}', expected object.`,
      ),
    );
    return state;
  }

  if (Object.keys(tokenNetworkFilter).length === 0) {
    return state;
  }

  const { MultichainNetworkController: multichainNetworkControllerState } =
    state;

  if (!isObject(multichainNetworkControllerState)) {
    global.sentry?.captureException?.(new Error());
    return state;
  }

  // Extract required state properties
  const { selectedMultichainNetworkChainId } = multichainNetworkControllerState;

  // Validate selectedMultichainNetworkChainId
  if (
    !selectedMultichainNetworkChainId ||
    typeof selectedMultichainNetworkChainId !== 'string'
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: selectedMultichainNetworkChainId is type '${typeof selectedMultichainNetworkChainId}', expected string.`,
      ),
    );
    return state;
  }

  // Create enabledNetworkMap by merging both EVM and non-EVM networks
  const evmEnabledNetworkMap = createEvmEnabledNetworkMap(
    tokenNetworkFilter as Record<string, boolean>,
  );
  const nonEvmEnabledNetworkMap = createNonEvmEnabledNetworkMap(
    selectedMultichainNetworkChainId,
  );

  // Merge both maps
  networkOrderControllerState.enabledNetworkMap = {
    ...evmEnabledNetworkMap,
    ...nonEvmEnabledNetworkMap,
  };

  return state;
}
