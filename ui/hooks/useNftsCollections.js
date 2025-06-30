import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { getNftContracts, getAllNfts } from '../ducks/metamask/metamask';
import {
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getSelectedInternalAccount,
  isGlobalNetworkSelectorRemoved,
} from '../selectors';
import { getEnabledNetworksByNamespace } from '../selectors/multichain/networks';
import { getCurrentChainId } from '../../shared/modules/selectors/networks';
import { getNftImage } from '../helpers/utils/nfts';
import { usePrevious } from './usePrevious';
import { useI18nContext } from './useI18nContext';

export function useNftsCollections() {
  const t = useI18nContext();
  const previouslyOwnedText = t('nftsPreviouslyOwned');
  const unknownCollectionText = t('unknownCollection');

  const [collections, setCollections] = useState({});
  const [previouslyOwnedCollection, setPreviouslyOwnedCollection] = useState({
    collectionName: previouslyOwnedText,
    nfts: [],
  });
  const isTokenNetworkFilterEqualCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );

  const allUserNfts = useSelector(getAllNfts);
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);

  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const chainId = useSelector(getCurrentChainId);
  const nfts = useMemo(() => {
    if (isGlobalNetworkSelectorRemoved) {
      // Filter NFTs to only include those from enabled networks
      const nftsFromEnabledNetworks = {};

      Object.entries(allUserNfts ?? {}).forEach(
        ([networkChainId, networkNfts]) => {
          if (
            enabledNetworksByNamespace?.[networkChainId] &&
            Array.isArray(networkNfts)
          ) {
            nftsFromEnabledNetworks[networkChainId] = networkNfts;
          }
        },
      );

      return nftsFromEnabledNetworks;
    }
    return isTokenNetworkFilterEqualCurrentNetwork
      ? allUserNfts?.[chainId] ?? []
      : allUserNfts;
  }, [
    isTokenNetworkFilterEqualCurrentNetwork,
    allUserNfts,
    chainId,
    enabledNetworksByNamespace,
  ]);
  const [nftsLoading, setNftsLoading] = useState(() => nfts?.length >= 0);
  const nftContracts = useSelector(getNftContracts);
  const prevNfts = usePrevious(nfts);
  const prevChainId = usePrevious(chainId);
  const prevSelectedAddress = usePrevious(selectedAddress);

  useEffect(() => {
    const getCollections = () => {
      setNftsLoading(true);
      if (selectedAddress === undefined || chainId === undefined) {
        return;
      }
      const newCollections = {};
      const newPreviouslyOwnedCollections = {
        collectionName: previouslyOwnedText,
        nfts: [],
      };

      const allNfts = Object.values(nfts).flat();

      allNfts.forEach((nft) => {
        if (nft?.isCurrentlyOwned === false) {
          newPreviouslyOwnedCollections.nfts.push(nft);
        } else if (newCollections[nft.address]) {
          newCollections[nft.address].nfts.push(nft);
        } else {
          const collectionContract = nftContracts.find(
            ({ address }) => address === nft.address,
          );
          newCollections[nft.address] = {
            collectionName: collectionContract?.name || unknownCollectionText,
            collectionImage: collectionContract?.logo || getNftImage(nft.image),
            nfts: [nft],
          };
        }
      });
      setCollections(newCollections);
      setPreviouslyOwnedCollection(newPreviouslyOwnedCollections);
      setNftsLoading(false);
    };

    if (
      !isEqual(prevNfts, nfts) ||
      !isEqual(prevSelectedAddress, selectedAddress) ||
      !isEqual(prevChainId, chainId)
    ) {
      getCollections();
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
  ]);

  return { nftsLoading, collections, previouslyOwnedCollection };
}
