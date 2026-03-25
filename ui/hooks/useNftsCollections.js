import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getNftContracts, getAllNfts } from '../ducks/metamask/metamask';
import { getSelectedInternalAccount } from '../selectors';
import { getEnabledNetworksByNamespace } from '../selectors/multichain/networks';
import { getNftImage } from '../helpers/utils/nfts';
import { useI18nContext } from './useI18nContext';

export function useNftsCollections() {
  const t = useI18nContext();
  const previouslyOwnedText = t('nftsPreviouslyOwned');
  const unknownCollectionText = t('unknownCollection');

  const allUserNfts = useSelector(getAllNfts);
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const nftContracts = useSelector(getNftContracts);

  const { collections, previouslyOwnedCollection } = useMemo(() => {
    if (selectedAddress === undefined) {
      return {
        collections: {},
        previouslyOwnedCollection: {
          collectionName: previouslyOwnedText,
          nfts: [],
        },
      };
    }

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

    const allNfts = Object.values(nftsFromEnabledNetworks).flat();
    const newCollections = {};
    const newPreviouslyOwned = {
      collectionName: previouslyOwnedText,
      nfts: [],
    };

    allNfts.forEach((nft) => {
      if (nft?.isCurrentlyOwned === false) {
        newPreviouslyOwned.nfts.push(nft);
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

    return {
      collections: newCollections,
      previouslyOwnedCollection: newPreviouslyOwned,
    };
  }, [
    allUserNfts,
    enabledNetworksByNamespace,
    selectedAddress,
    nftContracts,
    previouslyOwnedText,
    unknownCollectionText,
  ]);

  return { collections, previouslyOwnedCollection };
}
