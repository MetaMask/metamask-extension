import { cloneDeep } from 'lodash';
import {
  hasProperty,
  isObject,
  isStrictHexString,
  parseCaipChainId,
  KnownCaipNamespace,
} from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 190;

/**
 * This migration fixes malformed chain IDs in the enabledNetworkMap that may have
 * been created by migration 171 when selectedMultichainNetworkChainId was improperly formatted.
 *
 * It removes any chain IDs that don't match the expected format:
 * - EVM chains (eip155 namespace): must be hex strings starting with "0x"
 * - Non-EVM chains: must be valid CAIP-2 chain IDs (namespace:reference format)
 *
 * @param originalVersionedData - The versioned extension state.
 * @returns The updated versioned extension state with cleaned enabledNetworkMap.
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
 * Validates if a chain ID is properly formatted for its namespace
 *
 * @param chainId - The chain ID to validate
 * @param namespace - The CAIP namespace
 * @returns True if the chain ID is valid for the namespace
 */
function isValidChainIdForNamespace(
  chainId: string,
  namespace: string,
): boolean {
  // For EVM chains, must be a hex string
  if (namespace === KnownCaipNamespace.Eip155) {
    return isStrictHexString(chainId);
  }

  // For non-EVM chains, must be in CAIP format (namespace:reference)
  try {
    const parsed = parseCaipChainId(chainId);
    // Verify the namespace matches
    return parsed.namespace === namespace;
  } catch {
    return false;
  }
}

/**
 * Cleans the enabledNetworkMap by removing malformed chain IDs
 *
 * @param enabledNetworkMap - The enabled network map to clean
 * @returns The cleaned enabled network map
 */
function cleanEnabledNetworkMap(
  enabledNetworkMap: Record<string, Record<string, boolean>>,
): Record<string, Record<string, boolean>> {
  const cleanedMap: Record<string, Record<string, boolean>> = {};

  for (const [namespace, chainMap] of Object.entries(enabledNetworkMap)) {
    if (!isObject(chainMap)) {
      continue;
    }

    const cleanedChainMap: Record<string, boolean> = {};

    for (const [chainId, isEnabled] of Object.entries(chainMap)) {
      // Only keep properly formatted chain IDs
      if (isValidChainIdForNamespace(chainId, namespace)) {
        cleanedChainMap[chainId] = isEnabled;
      } else {
        // Log removal for debugging purposes
        global.sentry?.captureMessage?.(
          `Migration ${version}: Removed malformed chain ID "${chainId}" from namespace "${namespace}"`,
        );
      }
    }

    // Only include namespace if it has valid chains
    if (Object.keys(cleanedChainMap).length > 0) {
      cleanedMap[namespace] = cleanedChainMap;
    }
  }

  return cleanedMap;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  // Check if NetworkEnablementController exists
  if (!hasProperty(state, 'NetworkEnablementController')) {
    return state;
  }

  const networkEnablementController = state.NetworkEnablementController;

  if (!isObject(networkEnablementController)) {
    return state;
  }

  // Check if enabledNetworkMap exists
  if (!hasProperty(networkEnablementController, 'enabledNetworkMap')) {
    return state;
  }

  const { enabledNetworkMap } = networkEnablementController;

  if (!isObject(enabledNetworkMap)) {
    return state;
  }

  // Clean the enabledNetworkMap
  networkEnablementController.enabledNetworkMap =
    cleanEnabledNetworkMap(enabledNetworkMap);

  return state;
}
