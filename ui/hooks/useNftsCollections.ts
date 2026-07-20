import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Nft, NftContract } from '@metamask/assets-controllers';
import { getNftContracts, getAllNfts } from '../ducks/metamask/metamask';
import { getSelectedInternalAccount } from '../../shared/lib/selectors/accounts';
import { getEnabledNetworksByNamespace } from '../selectors/multichain/networks';
import { getNftImage } from '../helpers/utils/nfts';
import { useI18nContext } from './useI18nContext';

type NftCollection = {
  collectionName: string;
  collectionImage?: string;
  nfts: Nft[];
};

type NftsCollectionsResult = {
  collections: Record<string, NftCollection>;
  previouslyOwnedCollection: NftCollection;
};

export function useNftsCollections(): NftsCollectionsResult {
  const t = useI18nContext();
  const previouslyOwnedText = t('nftsPreviouslyOwned');
  const unknownCollectionText = t('unknownCollection');

  const allUserNfts = useSelector(getAllNfts) as Record<
    string,
    Nft[] | Record<string, Nft[]>
  > | null;
  const enabledNetworksByNamespace = useSelector(
    getEnabledNetworksByNamespace,
  ) as Record<string, unknown> | null;
  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const nftContracts = useSelector(getNftContracts) as NftContract[];

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

    const nftsFromEnabledNetworks: Record<string, Nft[]> = {};
    Object.entries(allUserNfts ?? {}).forEach(
      ([networkChainId, networkNfts]) => {
        if (
          enabledNetworksByNamespace?.[networkChainId] &&
          Array.isArray(networkNfts)
        ) {
          nftsFromEnabledNetworks[networkChainId] = networkNfts as Nft[];
        }
      },
    );

    const allNfts = Object.values(nftsFromEnabledNetworks).flat();
    const newCollections: Record<string, NftCollection> = {};
    const newPreviouslyOwned: NftCollection = {
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
