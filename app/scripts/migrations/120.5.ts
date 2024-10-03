import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 120.5;

/**
 * This migration removes invalid network configuration IDs from the SelectedNetworkController.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by
 * controller.
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

/**
 * A list of InfuraNetworkType values from extension v12.0.1
 * This version of the extension uses `@metamask/network-controller@18.1.2`, which in turn uses
 * the types from `@metamask/controller-utils@9.1.0`
 *
 * See https://github.com/MetaMask/core/blob/34542cf6e808f294fd83c7c5f70d1bc7418f8a9e/packages/controller-utils/src/types.ts#L4
 *
 * Hard-coded here rather than imported so that this migration continues to work correctly as these
 * constants get updated in the future.
 */
const infuraNetworkTypes = [
  'mainnet',
  'goerli',
  'sepolia',
  'linea-goerli',
  'linea-sepolia',
  'linea-mainnet',
];

/**
 * Remove invalid network configuration IDs from the SelectedNetworkController.
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 */
function transformState(state: Record<string, unknown>): void {
  if (!hasProperty(state, 'SelectedNetworkController')) {
    return;
  }
  if (!isObject(state.SelectedNetworkController)) {
    console.error(
      `Migration ${version}: Invalid SelectedNetworkController state of type '${typeof state.SelectedNetworkController}'`,
    );
    delete state.SelectedNetworkController;
    return;
  } else if (!hasProperty(state.SelectedNetworkController, 'domains')) {
    console.error(
      `Migration ${version}: Missing SelectedNetworkController domains state`,
    );
    delete state.SelectedNetworkController;
    return;
  } else if (!isObject(state.SelectedNetworkController.domains)) {
    console.error(
      `Migration ${version}: Invalid SelectedNetworkController domains state of type '${typeof state
        .SelectedNetworkController.domains}'`,
    );
    delete state.SelectedNetworkController;
    return;
  }

  if (!hasProperty(state, 'NetworkController')) {
    delete state.SelectedNetworkController;
    return;
  } else if (!isObject(state.NetworkController)) {
    console.error(
      new Error(
        `Migration ${version}: Invalid NetworkController state of type '${typeof state.NetworkController}'`,
      ),
    );
    delete state.SelectedNetworkController;
    return;
  } else if (!hasProperty(state.NetworkController, 'networkConfigurations')) {
    delete state.SelectedNetworkController;
    return;
  } else if (!isObject(state.NetworkController.networkConfigurations)) {
    console.error(
      new Error(
        `Migration ${version}: Invalid NetworkController networkConfigurations state of type '${typeof state.NetworkController}'`,
      ),
    );
    delete state.SelectedNetworkController;
    return;
  }

  const validNetworkConfigurationIds = [
    ...infuraNetworkTypes,
    ...Object.keys(state.NetworkController.networkConfigurations),
  ];
  const domainMappedNetworkConfigurationIds = Object.values(
    state.SelectedNetworkController.domains,
  );

  for (const configurationId of domainMappedNetworkConfigurationIds) {
    if (
      typeof configurationId !== 'string' ||
      !validNetworkConfigurationIds.includes(configurationId)
    ) {
      console.error(
        new Error(
          `Migration ${version}: Invalid networkConfigurationId found in SelectedNetworkController state: '${configurationId}'`,
        ),
      );
      delete state.SelectedNetworkController;
      return;
    }
  }
}
