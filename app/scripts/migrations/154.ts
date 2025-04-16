import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { BtcScope, SolScope } from '@metamask/keyring-api';
import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 154;

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
        [BtcScope.Testnet]:
          AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS[BtcScope.Testnet],
        [BtcScope.Signet]:
          AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS[BtcScope.Signet],
        [SolScope.Testnet]:
          AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS[SolScope.Testnet],
        [SolScope.Devnet]:
          AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS[SolScope.Devnet],
      };
  }

  return state;
}
