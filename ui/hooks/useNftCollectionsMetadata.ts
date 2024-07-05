import { useEffect, useMemo, useState } from 'react';
import { NameType } from '@metamask/name-controller';
import { Collection } from '@metamask/assets-controllers';
import { useSelector } from 'react-redux';
import { getCurrentChainId } from '../selectors';
import { fetchNftCollectionsMetadata } from '../store/actions';

export type UseNftCollectionsMetadataRequest = {
  value: string;
  type: NameType;
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

  const memoisedRequestsWithChainId = useMemo(() => {
    return {
      contracts: requests
        .filter(({ value }) => value)
        .map(({ value }) => value),
      chainId,
    };
  }, [JSON.stringify(requests), chainId]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const collectionsMetadata = await fetchNftCollectionsMetadata(
          memoisedRequestsWithChainId.contracts,
          memoisedRequestsWithChainId.chainId,
        );

        const collectionsData: CollectionsData =
          collectionsMetadata.collections.reduce(
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

    if (memoisedRequestsWithChainId.contracts.length > 0) {
      fetchCollections();
    }
  }, [memoisedRequestsWithChainId]);

  return collectionsMetadata;
}
