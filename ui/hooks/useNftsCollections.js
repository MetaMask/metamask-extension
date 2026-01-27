import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { getNftContracts, getAllNfts } from '../ducks/metamask/metamask';
import { getSelectedInternalAccount } from '../selectors';
import { getEnabledNetworksByNamespace } from '../selectors/multichain/networks';
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
  const allUserNfts = useSelector(getAllNfts);
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const enabledChainIds = Object.keys(enabledNetworksByNamespace);

  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);

  const nfts = useMemo(() => {
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
  }, [allUserNfts, enabledNetworksByNamespace]);

  const [nftsLoading, setNftsLoading] = useState(true);
  const nftContracts = useSelector(getNftContracts);
  const prevNfts = usePrevious(nfts);
  const prevEnabledChainIds = usePrevious(enabledChainIds);
  const prevSelectedAddress = usePrevious(selectedAddress);

  useEffect(() => {
    const getCollections = () => {
      setNftsLoading(true);
      if (selectedAddress === undefined || enabledChainIds.length === 0) {
        setNftsLoading(false);
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
      !isEqual(prevEnabledChainIds, enabledChainIds)
    ) {
      getCollections();
    }
  }, [
    nfts,
    prevNfts,
    nftContracts,
    setNftsLoading,
    enabledChainIds,
    prevEnabledChainIds,
    selectedAddress,
    prevSelectedAddress,
    previouslyOwnedText,
    unknownCollectionText,
  ]);

  return { nftsLoading, collections, previouslyOwnedCollection };
}
