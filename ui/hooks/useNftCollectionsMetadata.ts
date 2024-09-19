import { useEffect, useMemo, useState } from 'react';
import { Collection } from '@metamask/assets-controllers';
import { useSelector } from 'react-redux';
import { TokenStandard } from '../../shared/constants/transaction';
import { getCurrentChainId } from '../selectors';
import {
  getNFTContractInfo,
  getTokenStandardAndDetails,
} from '../store/actions';

export type UseNftCollectionsMetadataRequest = {
  value: string;
};

type CollectionsData = {
  [key: string]: Collection;
};

// For now, we only support ERC721 tokens
const SUPPORTED_NFT_TOKEN_STANDARDS = [TokenStandard.ERC721];

export function useNftCollectionsMetadata(
  requests: UseNftCollectionsMetadataRequest[],
) {
  const [collectionsMetadata, setCollectionsMetadata] =
    useState<CollectionsData>({});
  const chainId = useSelector(getCurrentChainId);

  const memoisedContracts = useMemo(() => {
    return requests
      .filter(({ value }) => value)
      .map(({ value }) => value.toLowerCase());
  }, [requests]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const contractStandardsResponses = await Promise.all(
          memoisedContracts.map((contractAddress) =>
            getTokenStandardAndDetails(contractAddress, chainId),
          ),
        );

        const supportedNFTContracts = memoisedContracts.filter(
          (_contractAddress, index) =>
            SUPPORTED_NFT_TOKEN_STANDARDS.includes(
              contractStandardsResponses[index].standard as TokenStandard,
            ),
        );

        if (supportedNFTContracts.length === 0) {
          return;
        }

        const collectionsResult = await getNFTContractInfo(
          supportedNFTContracts,
          chainId,
        );

        const collectionsData: CollectionsData =
          collectionsResult.collections.reduce(
            (acc: CollectionsData, collection, index) => {
              acc[supportedNFTContracts[index]] = {
                name: collection?.name,
                image: collection?.image,
                isSpam: collection?.isSpam,
              };
              return acc;
            },
            {},
          );

        setCollectionsMetadata(collectionsData);
      } catch (error) {
        // Ignore the error due to API failure
      }
    };

    if (memoisedContracts.length > 0) {
      fetchCollections();
    }
  }, [JSON.stringify(memoisedContracts), chainId]);

  return collectionsMetadata;
}
