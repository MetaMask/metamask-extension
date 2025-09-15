import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { captureException } from '../../../shared/lib/sentry';

export const version = 175;

/**
 * This migration updates the native currency to FRAX for the FRAX network configuration.
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
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  try {
    const FRAX_TESTNET = '0x9da';
    const networkControllerState = state.NetworkController;
    if (
      hasProperty(state, 'NetworkController') &&
      isObject(networkControllerState) &&
      hasProperty(networkControllerState, 'networkConfigurationsByChainId') &&
      isObject(networkControllerState.networkConfigurationsByChainId)
    ) {
      for (const networkConfiguration of Object.values(
        networkControllerState.networkConfigurationsByChainId,
      )) {
        if (
          isObject(networkConfiguration) &&
          (networkConfiguration.chainId === CHAIN_IDS.FRAX ||
            networkConfiguration.chainId === FRAX_TESTNET)
        ) {
          // update nativeCurrency to FRAX
          if (hasProperty(networkConfiguration, 'nativeCurrency')) {
            networkConfiguration.nativeCurrency = 'FRAX';
          }
        }
      }
    }
    return state;
  } catch (error) {
    captureException(
      new Error(
        `Migration ${version}: Failed to update native currency for FRAX network configuration. Error: ${(error as Error).message}`,
      ),
    );
    return state;
  }
}
