import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  type CaipAssetType,
  parseCaipAssetType,
  parseCaipChainId,
} from '@metamask/utils';

import { getNetworkConfigurationsByChainId } from '../../shared/lib/selectors/networks';
import { convertCaipToHexChainId } from '../../shared/lib/network.utils';
import { getFeaturedEvmNetworks } from '../selectors/config-registry/config-registry';
import { addNetwork } from '../store/actions';
import { useDispatch } from '../store/hooks';

/**
 * Adds an unconfigured featured EVM network for an asset.
 *
 * @returns A callback that resolves to the added network's display name and
 * network client ID, or null when no network was added.
 */
export const useEnableFeaturedEvmNetwork = () => {
  const dispatch = useDispatch();
  const evmNetworkConfigurations = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const featuredEvmNetworks = useSelector(getFeaturedEvmNetworks);

  return useCallback(
    async (
      assetId: CaipAssetType,
    ): Promise<{ name: string; networkClientId?: string } | null> => {
      const { chainId } = parseCaipAssetType(assetId);
      const { namespace } = parseCaipChainId(chainId);
      if (namespace !== 'eip155') {
        return null;
      }

      const chainIdHex = convertCaipToHexChainId(chainId);
      const featuredEvmNetwork = featuredEvmNetworks.find(
        (network) => network.chainId === chainIdHex,
      );
      if (!featuredEvmNetwork || evmNetworkConfigurations[chainIdHex]) {
        return null;
      }

      const addedNetwork = await dispatch(
        addNetwork(featuredEvmNetwork, { setActive: false }),
      );
      if (!addedNetwork) {
        return null;
      }

      const endpoint =
        addedNetwork.rpcEndpoints?.[addedNetwork.defaultRpcEndpointIndex ?? 0];
      return {
        name: featuredEvmNetwork.name,
        networkClientId: endpoint?.networkClientId,
      };
    },
    [dispatch, evmNetworkConfigurations, featuredEvmNetworks],
  );
};
