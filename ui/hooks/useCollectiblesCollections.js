import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import {
  getCollectibles,
  getCollectibleContracts,
} from '../ducks/metamask/metamask';
import { getCurrentChainId, getSelectedAddress } from '../selectors';
import { usePrevious } from './usePrevious';

export function useCollectiblesCollections() {
  const [collections, setCollections] = useState({});
  const [previouslyOwnedCollection, setPreviouslyOwnedCollection] = useState({
    collectionName: 'Previously Owned',
    collectibles: [],
  });
  const collectibles = useSelector(getCollectibles);
  const [collectiblesLoading, setCollectiblesLoading] = useState(
    () => collectibles?.length >= 0,
  );
  const selectedAddress = useSelector(getSelectedAddress);
  const chainId = useSelector(getCurrentChainId);
  const collectibleContracts = useSelector(getCollectibleContracts);
  const prevCollectibles = usePrevious(collectibles);
  const prevChainId = usePrevious(chainId);
  const prevSelectedAddress = usePrevious(selectedAddress);
  useEffect(() => {
    const getCollections = () => {
      setCollectiblesLoading(true);
      if (selectedAddress === undefined || chainId === undefined) {
        return;
      }
      const newCollections = {};
      const newPreviouslyOwnedCollections = {
        collectionName: 'Previously Owned',
        collectibles: [],
      };

      collectibles.forEach((collectible) => {
        if (collectible?.isCurrentlyOwned === false) {
          newPreviouslyOwnedCollections.collectibles.push(collectible);
        } else if (newCollections[collectible.address]) {
          newCollections[collectible.address].collectibles.push(collectible);
        } else {
          const collectionContract = collectibleContracts.find(
            ({ address }) => address === collectible.address,
          );
          newCollections[collectible.address] = {
            collectionName: collectionContract?.name || collectible.name,
            collectionImage:
              collectionContract?.logo || collectible.collectionImage,
            collectibles: [collectible],
          };
        }
      });
      setCollections(newCollections);
      setPreviouslyOwnedCollection(newPreviouslyOwnedCollections);
      setCollectiblesLoading(false);
    };

    if (
      !isEqual(prevCollectibles, collectibles) ||
      !isEqual(prevSelectedAddress, selectedAddress) ||
      !isEqual(prevChainId, chainId)
    ) {
      getCollections();
    }
  }, [
    collectibles,
    prevCollectibles,
    collectibleContracts,
    setCollectiblesLoading,
    chainId,
    prevChainId,
    selectedAddress,
    prevSelectedAddress,
  ]);

  return { collectiblesLoading, collections, previouslyOwnedCollection };
}
