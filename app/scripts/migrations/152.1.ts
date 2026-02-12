import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 152.1;

// Since this is a migration, we don't want to rely on data
// from outside packages that could change. Therefore, we'll
// use literal values.
export const TESTNETS = {
  'bip122:000000000933ea01ad0ee984209779ba': {
    chainId: 'bip122:000000000933ea01ad0ee984209779ba',
    name: 'Bitcoin Testnet',
    nativeCurrency: 'bip122:000000000933ea01ad0ee984209779ba/slip44:0',
    isEvm: false,
  },
  'bip122:00000008819873e925422c1ff0f99f7c': {
    chainId: 'bip122:00000008819873e925422c1ff0f99f7c',
    name: 'Bitcoin Mutinynet',
    nativeCurrency: 'bip122:00000008819873e925422c1ff0f99f7c/slip44:0',
    isEvm: false,
  },
  'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z': {
    chainId: 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
    name: 'Solana Testnet',
    nativeCurrency: 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z/slip44:501',
    isEvm: false,
  },
  'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': {
    chainId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    name: 'Solana Devnet',
    nativeCurrency: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/slip44:501',
    isEvm: false,
  },
};

/**
 * This migration adds test network configurations to the MultichainNetworkController.
 * Networks added: Bitcoin testnet, Bitcoin Signet, Solana testnet, and Solana devnet.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
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

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (
    hasProperty(state, 'MultichainNetworkController') &&
    isObject(state.MultichainNetworkController) &&
    isObject(
      state.MultichainNetworkController
        .multichainNetworkConfigurationsByChainId,
    )
  ) {
    state.MultichainNetworkController.multichainNetworkConfigurationsByChainId =
      {
        ...state.MultichainNetworkController
          .multichainNetworkConfigurationsByChainId,
        ...TESTNETS,
      };
  }

  return state;
}
