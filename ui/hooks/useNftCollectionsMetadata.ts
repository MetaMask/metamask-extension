import { useEffect, useMemo, useState } from 'react';
import { Collection } from '@metamask/assets-controllers';
import { useSelector } from 'react-redux';
import { getCurrentChainId } from '../selectors';
import { fetchNftCollectionsMetadata } from '../store/actions';

export type UseNftCollectionsMetadataRequest = {
  value: string;
};

type CollectionsData = {
  [key: string]: Collection;
};

export function useNftCollectionsMetadata(
  requests: UseNftCollectionsMetadataRequest[],
) {
  const chainId = useSelector(getCurrentChainId);
  const [collectionsMetadata, setCollectionsMetadata] =
    useState<CollectionsData>({});

  const memoisedContracts = useMemo(() => {
    return requests.filter(({ value }) => value).map(({ value }) => value);
  }, [JSON.stringify(requests)]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const collectionsResult = await fetchNftCollectionsMetadata(
          memoisedContracts,
          chainId,
        );

        const collectionsData: CollectionsData =
          collectionsResult.collections.reduce(
            (acc: CollectionsData, collection) => {
              // This cast is necessary because the id is set as optional string in the Collection type
              const collectionKey = (collection.id as string).toLowerCase();
              acc[collectionKey] = collection;
              return acc;
            },
            {},
          );

        setCollectionsMetadata(collectionsData);
      } catch (error) {
        // Ignore the error due to api failure
      }
    };

    if (memoisedContracts.length > 0) {
      fetchCollections();
    }
  }, [memoisedContracts, chainId]);

  return collectionsMetadata;
}
