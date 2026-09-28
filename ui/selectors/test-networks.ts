import { type CaipChainId, type Hex } from '@metamask/utils';
import { createSelector } from 'reselect';
import { getNetworkConfigurationsByChainId } from '../../shared/lib/selectors/networks';
import { isTestNetwork } from '../helpers/utils/network-helper';
import { getSelectedMultichainNetworkChainId } from './multichain/networks';
import {
  getAllDomains,
  getPermissionSubjects,
  getShowTestNetworksPreference,
} from './selectors';

const getSelectedChainId = (
  state: Parameters<typeof getSelectedMultichainNetworkChainId>[0],
) => {
  try {
    return getSelectedMultichainNetworkChainId(state);
  } catch {
    return undefined;
  }
};

const isTestChain = (chainId: string | undefined): boolean => {
  if (!chainId) {
    return false;
  }
  try {
    return isTestNetwork(chainId as CaipChainId | Hex);
  } catch {
    return false;
  }
};

/**
 * True when the wallet's selected network is a testnet, or a connected dapp
 * is on a testnet. `domains` remembers per-origin network client ids; entries
 * for disconnected origins are ignored via `getPermittedAccountsByOrigin`.
 */
export const getIsTestnetInUse = createSelector(
  getSelectedChainId,
  getAllDomains,
  getNetworkConfigurationsByChainId,
  getPermissionSubjects,
  (selectedChainId, domains, networkConfigurationsByChainId, subjects) => {
    if (isTestChain(selectedChainId)) {
      return true;
    }

    if (!networkConfigurationsByChainId) {
      return false;
    }

    return Object.entries(domains ?? {}).some(
      ([origin, networkClientId]) =>
        typeof networkClientId === 'string' &&
        Boolean(subjects[origin]) &&
        Object.values(networkConfigurationsByChainId).some(
          (network) =>
            isTestChain(network.chainId) &&
            network.rpcEndpoints?.some(
              (endpoint) => endpoint.networkClientId === networkClientId,
            ),
        ),
    );
  },
);

export const getShouldShowTestNetworks = createSelector(
  getShowTestNetworksPreference,
  getIsTestnetInUse,
  (showTestNetworks, isTestnetInUse) => showTestNetworks || isTestnetInUse,
);
