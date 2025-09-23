import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { CHAIN_IDS } from '../../../shared/constants/network';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 178;

export const CHAINS_TO_RENAME: {
  readonly id: string;
  readonly fromName: string;
  readonly toName: string;
}[] = [
  {
    id: CHAIN_IDS.MAINNET,
    fromName: 'Ethereum Mainnet',
    toName: 'Ethereum',
  },
  {
    id: CHAIN_IDS.LINEA_MAINNET,
    fromName: 'Linea Mainnet',
    toName: 'Linea',
  },
  {
    id: CHAIN_IDS.BASE,
    fromName: 'Base Mainnet',
    toName: 'Base',
  },
  {
    id: CHAIN_IDS.ARBITRUM,
    fromName: 'Arbitrum One',
    toName: 'Arbitrum',
  },
  {
    id: CHAIN_IDS.AVALANCHE,
    fromName: 'Avalanche Network C-Chain',
    toName: 'Avalanche',
  },
  {
    id: CHAIN_IDS.BSC,
    fromName: 'Binance Smart Chain',
    toName: 'BNB Chain',
  },
  {
    id: CHAIN_IDS.OPTIMISM,
    fromName: 'OP Mainnet',
    toName: 'OP',
  },
  {
    id: CHAIN_IDS.POLYGON,
    fromName: 'Polygon Mainnet',
    toName: 'Polygon',
  },
  {
    id: CHAIN_IDS.SEI,
    fromName: 'Sei Mainnet',
    toName: 'Sei',
  },
  {
    id: CHAIN_IDS.ZKSYNC_ERA,
    fromName: 'zkSync Era Mainnet',
    toName: 'zkSync Era',
  },
];

/**
 * This migration updates network names.
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
 * Modifies all chain names according to CHAINS_TO_RENAME.
 *
 * @param state - The state object to transform.
 */
function transformState(state: Record<string, unknown>) {
  // Validate if the NetworkController state exists and has the expected structure.
  if (
    !(
      hasProperty(state, 'NetworkController') &&
      isObject(state.NetworkController) &&
      hasProperty(state.NetworkController, 'networkConfigurationsByChainId') &&
      isObject(state.NetworkController.networkConfigurationsByChainId)
    )
  ) {
    return;
  }

  for (const chain of CHAINS_TO_RENAME) {
    const networkConfigsByChainId =
      state.NetworkController.networkConfigurationsByChainId;

    // If the chain ID is not found, skip it.
    if (!hasProperty(networkConfigsByChainId, chain.id)) {
      continue;
    }

    // If the network configuration for the chain is not found, skip it.
    const networkConfigsForChain = networkConfigsByChainId[chain.id];
    if (
      isObject(networkConfigsForChain) &&
      hasProperty(networkConfigsForChain, 'name') &&
      networkConfigsForChain.name === chain.fromName
    ) {
      networkConfigsForChain.name = chain.toName;
    }
  }
}
