import { NetworkConfiguration } from '@metamask/network-controller';
import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export const version = 128;

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
  if (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController) &&
    hasProperty(state.NetworkController, 'networkConfigurations') &&
    isObject(state.NetworkController.networkConfigurations)
  ) {
    for (const networkConfiguration of Object.values(
      state.NetworkController.networkConfigurations as Record<
        string,
        {
          chainId: string;
          ticker: string;
        }
      >,
    )) {
      if (
        networkConfiguration.chainId === '0x89' &&
        networkConfiguration.ticker === 'MATIC'
      ) {
        networkConfiguration.ticker = 'POL';
      }
    }
  }
  return state;
}
