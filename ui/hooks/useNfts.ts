import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { getNftContracts, getAllNfts } from '../ducks/metamask/metamask';
import {
  getAllChainsToPoll,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getSelectedInternalAccount,
  isGlobalNetworkSelectorRemoved,
} from '../selectors';
import { getEnabledNetworksByNamespace } from '../selectors/multichain/networks';
import { getCurrentChainId } from '../../shared/modules/selectors/networks';
import { NFT } from '../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { endTrace, trace, TraceName } from '../../shared/lib/trace';
import { usePrevious } from './usePrevious';
import { useI18nContext } from './useI18nContext';

export function useNfts({
  overridePopularNetworkFilter = false,
}: {
  overridePopularNetworkFilter?: boolean;
} = {}) {
  const t = useI18nContext();

  const allUserNfts = useSelector(getAllNfts);

  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const chainId = useSelector(getCurrentChainId);

  const allChainIds = useSelector(getAllChainsToPoll);
  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);

  const nfts = useMemo(() => {
    if (isGlobalNetworkSelectorRemoved) {
      // Filter NFTs to only include those from enabled networks
      const nftsFromEnabledNetworks: Record<string, NFT[]> = {};

      if (overridePopularNetworkFilter) {
        return allUserNfts?.[chainId] ?? [];
      }

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

      return nftsFromEnabledNetworks;
    }
    trace({ name: TraceName.LoadCollectibles });
    const nftList =
      isTokenNetworkFilterEqualCurrentNetwork || overridePopularNetworkFilter
        ? (allUserNfts?.[chainId] ?? [])
        : allUserNfts;

    endTrace({ name: TraceName.LoadCollectibles });
    return nftList;
  }, [
    isTokenNetworkFilterEqualCurrentNetwork,
    overridePopularNetworkFilter,
    allUserNfts,
    chainId,
    enabledNetworksByNamespace,
  ]);

  const nftContracts = useSelector(getNftContracts);

  const previouslyOwnedText = t('nftsPreviouslyOwned');
  const unknownCollectionText = t('unknownCollection');

  const [currentlyOwnedNfts, setCurrentlyOwnedNfts] = useState<NFT[]>([]);
  const [previouslyOwnedNfts, setPreviouslyOwnedNfts] = useState<NFT[]>([]);
  const [loading, setNftsLoading] = useState(() => nfts?.length >= 0);
  const prevNfts = usePrevious(nfts);
  const prevChainId = usePrevious(allChainIds);
  const prevSelectedAddress = usePrevious(selectedAddress);

  useEffect(() => {
    const selectNfts = () => {
      setNftsLoading(true);
      if (selectedAddress === undefined || allChainIds === undefined) {
        return;
      }

      const previousNfts: NFT[] = [];
      const currentNfts: NFT[] = [];

      const allNfts: NFT[] = Object.values(nfts).flat() as NFT[];

      allNfts.forEach((nft: NFT) => {
        if (nft?.isCurrentlyOwned === false) {
          previousNfts.push(nft);
        } else {
          currentNfts.push(nft);
        }
      });
      setPreviouslyOwnedNfts(previousNfts);
      setCurrentlyOwnedNfts(currentNfts);
      setNftsLoading(false);
    };

    if (
      !isEqual(prevNfts, nfts) ||
      !isEqual(prevSelectedAddress, selectedAddress) ||
      !isEqual(prevChainId, chainId)
    ) {
      selectNfts();
    }
  }, [
    nfts,
    prevNfts,
    nftContracts,
    setNftsLoading,
    chainId,
    prevChainId,
    selectedAddress,
    prevSelectedAddress,
    previouslyOwnedText,
    unknownCollectionText,
    allChainIds,
  ]);

  return { loading, currentlyOwnedNfts, previouslyOwnedNfts };
}
