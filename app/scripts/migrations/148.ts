import { toHex } from '@metamask/controller-utils';
import { getErrorMessage, hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export const version = 148;

/**
 * This migration resets sessionData and isSignedIn if using the old sessionData state shape.
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
    throw new Error(`newState.NetworkController must be present`);
  }

  if (!isObject(newState.NetworkController)) {
    throw new Error(
      `state.NetworkController must be an object, but is: ${typeof newState.NetworkController}`,
    );
  }
  if (
    !hasProperty(newState.NetworkController, 'networkConfigurationsByChainId')
  ) {
    throw new Error(
      `state.NetworkController.networkConfigurationsByChainId must be present`,
    );
  }

  if (!isObject(newState.NetworkController.networkConfigurationsByChainId)) {
    throw new Error(
      `state.NetworkController.networkConfigurationsByChainId must be an object, but is: ${typeof newState
        .NetworkController.networkConfigurationsByChainId}`,
    );
  }

  const { networkConfigurationsByChainId } = newState.NetworkController;

  for (const [chainId, networkConfiguration] of Object.entries(
    networkConfigurationsByChainId,
  )) {
    if (!isObject(networkConfiguration)) {
      throw new Error(
        `state.NetworkController.networkConfigurationsByChainId has a network configuration under '${chainId}' that must be an object but is: ${typeof networkConfiguration}`,
      );
    }

    const chainIdAsHex = toHex(chainId);

    if (typeof networkConfiguration.chainId !== 'string') {
      throw new Error(
        `state.NetworkController.networkConfigurationsByChainId has a network configuration under '${chainId}' with a chainId that must be a string but is: ${typeof networkConfiguration.chainId}`,
      );
    }

    networkConfiguration.chainId = toHex(networkConfiguration.chainId);

    if (chainIdAsHex !== chainId) {
      delete networkConfigurationsByChainId[chainId];
    }
    networkConfigurationsByChainId[chainIdAsHex] = networkConfiguration;
  }

  return newState;
}
