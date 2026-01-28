import { toHex } from '@metamask/controller-utils';
import { getErrorMessage, hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export const version = 149;

/**
 * This migration corrects chain IDs in NetworkController state so that they are
 * hex strings and not decimals.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: {
  meta: { version: number };
  data: Record<string, unknown>;
}) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  try {
    versionedData.data = transformState(versionedData.data);
  } catch (error) {
    global.sentry?.captureException?.(
      new Error(`Migration #${version}: ${getErrorMessage(error)}`),
    );
  }
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  const newState = cloneDeep(state);

  if (!hasProperty(newState, 'NetworkController')) {
    return newState;
  }

  if (!isObject(newState.NetworkController)) {
    return newState;
  }
  if (
    !hasProperty(newState.NetworkController, 'networkConfigurationsByChainId')
  ) {
    return newState;
  }

  if (!isObject(newState.NetworkController.networkConfigurationsByChainId)) {
    return newState;
  }

  const { networkConfigurationsByChainId } = newState.NetworkController;

  for (const [chainId, networkConfiguration] of Object.entries(
    networkConfigurationsByChainId,
  )) {
    let chainIdAsHex;
    try {
      chainIdAsHex = toHex(chainId);
    } catch {
      // If chainId cannot be converted to hex, skip this migration
      return state;
    }

    if (!isObject(networkConfiguration)) {
      return state;
    }

    if (typeof networkConfiguration.chainId !== 'string') {
      return state;
    }

    networkConfiguration.chainId = chainIdAsHex;

    if (chainIdAsHex !== chainId) {
      delete networkConfigurationsByChainId[chainId];
      networkConfigurationsByChainId[chainIdAsHex] = networkConfiguration;
    }
  }

  return newState;
}
