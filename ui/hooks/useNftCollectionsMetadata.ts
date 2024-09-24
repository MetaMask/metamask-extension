import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Collection } from '@metamask/assets-controllers';
import type { Hex } from '@metamask/utils';
import { TokenStandard } from '../../shared/constants/transaction';
import { getCurrentChainId } from '../selectors';
import {
  getNFTContractInfo,
  getTokenStandardAndDetails,
} from '../store/actions';
import { useAsyncResult } from './useAsyncResult';

export type UseNftCollectionsMetadataRequest = {
  value: string;
  chainId?: string;
};

type CollectionsData = {
  [key: string]: Collection;
};

// For now, we only support ERC721 tokens
const SUPPORTED_NFT_TOKEN_STANDARDS = [TokenStandard.ERC721];

async function fetchCollections(
  memoisedContracts: string[],
  chainId: string,
): Promise<CollectionsData> {
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
    return {};
  }

  const collectionsResult = await getNFTContractInfo(
    supportedNFTContracts,
    chainId,
  );

  const collectionsData: CollectionsData = collectionsResult.collections.reduce(
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

  return collectionsData;
}

export function useNftCollectionsMetadata(
  requests: UseNftCollectionsMetadataRequest[],
  providedChainId?: Hex,
) {
  const chainId = useSelector(getCurrentChainId) || providedChainId;

  const memoisedContracts = useMemo(() => {
    return requests
      .filter(({ value }) => value)
      .map(({ value }) => value.toLowerCase());
  }, [requests]);

  const { value: collectionsMetadata } = useAsyncResult(
    () => fetchCollections(memoisedContracts, chainId),
    [JSON.stringify(memoisedContracts), chainId],
  );

  return collectionsMetadata || {};
}
