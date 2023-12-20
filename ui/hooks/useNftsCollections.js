import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { getNfts, getNftContracts } from '../ducks/metamask/metamask';
import { getCurrentChainId, getSelectedInternalAccount } from '../selectors';
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
  const nfts = useSelector(getNfts);
  const [nftsLoading, setNftsLoading] = useState(() => nfts?.length >= 0);
  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const chainId = useSelector(getCurrentChainId);
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

      nfts.forEach((nft) => {
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
            collectionImage: collectionContract?.logo || nft.image,
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
