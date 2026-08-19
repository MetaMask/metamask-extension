import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  type CaipAssetType,
  parseCaipAssetType,
  parseCaipChainId,
} from '@metamask/utils';

import { getNetworkConfigurationsByChainId } from '../../../shared/lib/selectors/networks';
import { convertCaipToHexChainId } from '../../../shared/lib/network.utils';
import { getFeaturedEvmNetworks } from '../../selectors/config-registry/config-registry';
import { addNetwork } from '../../store/actions';
import { useDispatch } from '../../store/hooks';

/**
 * Adds a missing popular EVM network for an asset and returns its name.
 * @returns A callback that resolves to the added network's name, or null when
 * no network was added.
 */
export const useEnableDiscoverAssetNetwork = () => {
  const dispatch = useDispatch();
  const evmNetworkConfigurations = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const featuredEvmNetworks = useSelector(getFeaturedEvmNetworks);

  return useCallback(
    async (assetId: CaipAssetType): Promise<string | null> => {
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
      return addedNetwork ? featuredEvmNetwork.name : null;
    },
    [dispatch, evmNetworkConfigurations, featuredEvmNetworks],
  );
};
