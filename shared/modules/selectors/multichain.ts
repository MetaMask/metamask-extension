import { createSelector } from 'reselect';
import { CaipNamespace, Hex, KnownCaipNamespace } from '@metamask/utils';
import { selectDefaultNetworkClientIdsByChainId } from './networks';

type EnabledNetworksByChainId = Record<CaipNamespace, Record<string, boolean>>;

/**
 *
 * @param state - Root state.
 * @param state.metamask - MetaMask state.
 * @param state.metamask.enabledNetworkMap - The map of enabled networks.
 * @returns The map of enabled networks.
 */
export const getEnabledNetworks = (state: {
  metamask: {
    enabledNetworkMap: EnabledNetworksByChainId;
  };
}) => state.metamask.enabledNetworkMap;

export const selectAllEnabledNetworkClientIds = createSelector(
  getEnabledNetworks,
  selectDefaultNetworkClientIdsByChainId,
  (allEnabledNetworks, defaultNetworkClientIdsByChainId) => {
    const chainIds = Object.entries(
      allEnabledNetworks[KnownCaipNamespace.Eip155],
    )
      .filter(([_chainId, isEnabled]) => isEnabled)
      .map(([chainId, _isEnabled]) => chainId) as Hex[];
    return chainIds.map((chainId) => defaultNetworkClientIdsByChainId[chainId]);
  },
);
