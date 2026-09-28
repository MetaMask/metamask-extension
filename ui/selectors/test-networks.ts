import { Caip25EndowmentPermissionName } from '@metamask/chain-agnostic-permission';
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
 * True when a test network in the wallet or a connected dapp is actively in use.
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

    return Object.entries(domains ?? {}).some(
      ([origin, networkClientId]) =>
        Boolean(
          subjects[origin]?.permissions?.[Caip25EndowmentPermissionName],
        ) &&
        Object.values(networkConfigurationsByChainId ?? {}).some(
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
