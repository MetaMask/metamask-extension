import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { CHAIN_IDS } from '../../../shared/constants/network';

export const version = 130;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

/**
 * Migrates MATIC ticker in Network Configuration to POL ticker as per the direction in https://polygon.technology/blog/save-the-date-matic-pol-migration-coming-september-4th-everything-you-need-to-know
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
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
  const networkControllerState = state.NetworkController;
  if (
    hasProperty(state, 'NetworkController') &&
    isObject(networkControllerState) &&
    hasProperty(networkControllerState, 'networkConfigurations') &&
    isObject(networkControllerState.networkConfigurations)
  ) {
    for (const networkConfiguration of Object.values(
      networkControllerState.networkConfigurations,
    )) {
      if (
        isObject(networkConfiguration) &&
        networkConfiguration.chainId === CHAIN_IDS.POLYGON &&
        networkConfiguration.ticker === 'MATIC'
      ) {
        networkConfiguration.ticker = 'POL';
      }
    }
  }

  if (
    hasProperty(state, 'NetworkController') &&
    isObject(networkControllerState) &&
    hasProperty(networkControllerState, 'providerConfig') &&
    isObject(networkControllerState.providerConfig) &&
    hasProperty(networkControllerState.providerConfig, 'chainId') &&
    networkControllerState.providerConfig.chainId === CHAIN_IDS.POLYGON &&
    networkControllerState.providerConfig.ticker === 'MATIC'
  ) {
    networkControllerState.providerConfig.ticker = 'POL';
  }
  return {
    ...state,
    NetworkController: networkControllerState,
  };
}
