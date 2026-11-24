import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { Hex } from '@metamask/utils';
import { getImageForChainId } from '../../../selectors/multichain';
import { getChainIdToNetworkImageUrlMap } from '../../../selectors/config-registry/config-registry';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../shared/lib/selectors/networks';

/**
 * Returns a map of chain IDs to their network name and image.
 *
 * @returns A map of chain IDs to their network name and image.
 */
export const useChainNetworkNameAndImageMap = () => {
  const allNetworkConfigurationsByCaipChainId = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );
  const networkImageUrls = useSelector(getChainIdToNetworkImageUrlMap);

  const chainNetworkNAmeAndImageMap = useMemo(() => {
    const map = new Map<
      string,
      { networkName: string; networkImage: string }
    >();

    Object.values(allNetworkConfigurationsByCaipChainId).forEach((network) => {
      const chainId = network.chainId as Hex;
      const chainNetworkImage = getImageForChainId(chainId, networkImageUrls);
      const chainNetworkName = network?.name;

      map.set(chainId, {
        networkName: chainNetworkName ?? '',
        networkImage: chainNetworkImage ?? '',
      });
    });

    return map;
  }, [allNetworkConfigurationsByCaipChainId, networkImageUrls]);

  return chainNetworkNAmeAndImageMap;
};
