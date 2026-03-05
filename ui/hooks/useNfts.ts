import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getAllNfts } from '../ducks/metamask/metamask';
import { getEnabledNetworksByNamespace } from '../selectors/multichain/networks';
import { getCurrentChainId } from '../../shared/modules/selectors/networks';
import { NFT } from '../components/multichain/asset-picker-amount/asset-picker-modal/types';

export function useNfts({
  overridePopularNetworkFilter = false,
}: {
  overridePopularNetworkFilter?: boolean;
} = {}) {
  const allUserNfts = useSelector(getAllNfts);
  const chainId = useSelector(getCurrentChainId);
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);

  const { currentlyOwnedNfts, previouslyOwnedNfts } = useMemo(() => {
    if (overridePopularNetworkFilter) {
      const chainNfts = (allUserNfts?.[chainId] ?? []) as NFT[];
      return {
        currentlyOwnedNfts: chainNfts.filter(
          (nft) => nft?.isCurrentlyOwned !== false,
        ),
        previouslyOwnedNfts: chainNfts.filter(
          (nft) => nft?.isCurrentlyOwned === false,
        ),
      };
    }

    const nftsFromEnabledNetworks: Record<string, NFT[]> = {};
    Object.entries(allUserNfts ?? {}).forEach(
      ([networkChainId, networkNfts]) => {
        if (
          enabledNetworksByNamespace?.[networkChainId] &&
          Array.isArray(networkNfts)
        ) {
          nftsFromEnabledNetworks[networkChainId] = networkNfts as NFT[];
        }
      },
    );

    const allNfts: NFT[] = Object.values(nftsFromEnabledNetworks).flat();
    const current: NFT[] = [];
    const previous: NFT[] = [];

    allNfts.forEach((nft) => {
      if (nft?.isCurrentlyOwned === false) {
        previous.push(nft);
      } else {
        current.push(nft);
      }
    });

    return { currentlyOwnedNfts: current, previouslyOwnedNfts: previous };
  }, [
    overridePopularNetworkFilter,
    allUserNfts,
    chainId,
    enabledNetworksByNamespace,
  ]);

  return { currentlyOwnedNfts, previouslyOwnedNfts };
}
