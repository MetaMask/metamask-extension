import { hasProperty, isObject } from '@metamask/utils';
import { NetworkConfiguration } from '@metamask/network-controller';
import { cloneDeep } from 'lodash';
import { CHAIN_IDS } from '../../../shared/constants/network';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 173;

/**
 * This migration updates the SEI network name from `Sei Network` to `Sei`.
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

function transformState(state: Record<string, unknown>) {
  const fromName = 'Sei Network';
  const toName = 'Sei Mainnet';
  const seiChainId = CHAIN_IDS.SEI;

  // We only update the network name if it exists in the state
  // and matches the expected chain ID and name.
  if (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController) &&
    isObject(state.NetworkController.networkConfigurationsByChainId) &&
    hasProperty(
      state.NetworkController.networkConfigurationsByChainId,
      seiChainId,
    ) &&
    isObject(
      state.NetworkController.networkConfigurationsByChainId[seiChainId],
    ) &&
    hasProperty(
      state.NetworkController.networkConfigurationsByChainId[
        seiChainId
      ] as NetworkConfiguration,
      'name',
    ) &&
    (
      state.NetworkController.networkConfigurationsByChainId[
        seiChainId
      ] as NetworkConfiguration
    ).name === fromName
  ) {
    (
      state.NetworkController.networkConfigurationsByChainId[
        seiChainId
      ] as NetworkConfiguration
    ).name = toName;
  }
  return state;
}
