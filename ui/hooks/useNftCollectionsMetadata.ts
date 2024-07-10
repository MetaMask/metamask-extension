import { useEffect, useMemo, useState } from 'react';
import { Collection } from '@metamask/assets-controllers';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { TokenStandard } from '../../shared/constants/transaction';
import { hexToDecimal } from '../../shared/modules/conversion.utils';
import { getCurrentChainId } from '../selectors';
import { getNFTTokenInfo } from '../store/actions';

export type UseNftCollectionsMetadataRequest = {
  standard?: TokenStandard;
  tokenId?: Hex;
  value: string;
};

type CollectionsData = {
  [key: string]: Collection;
};

const NFT_TOKEN_STANDARDS = [TokenStandard.ERC1155, TokenStandard.ERC721];

export function useNftCollectionsMetadata(
  requests: UseNftCollectionsMetadataRequest[],
) {
  const chainId = useSelector(getCurrentChainId);
  const [collectionsMetadata, setCollectionsMetadata] =
    useState<CollectionsData>({});
  const nftRequests = requests
    .filter(({ standard }) =>
      NFT_TOKEN_STANDARDS.includes(standard as TokenStandard),
    )
    .filter(({ value }) => value);

  const memoisedNFTRequests = useMemo(() => {
    return nftRequests.map(({ value, tokenId, standard }) => ({
      address: value,
      tokenId,
      standard,
    }));
  }, [JSON.stringify(nftRequests)]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const tokensResult = await getNFTTokenInfo(
          [chainId],
          memoisedNFTRequests.map(({ address, tokenId }) => ({
            contractAddress: address,
            tokenId: hexToDecimal(tokenId as string),
          })),
        );

        const collectionsData: CollectionsData = tokensResult.reduce(
          (acc: CollectionsData, tokenResponse) => {
            const { contract, tokenId, collection } = tokenResponse.token;
            acc[`${contract.toLowerCase()}:${tokenId.toLowerCase()}`] =
              collection as Collection;
            return acc;
          },
          {},
        );

        setCollectionsMetadata(collectionsData);
      } catch (error) {
        // Ignore the error due to api failure
      }
    };

    if (memoisedNFTRequests.length > 0) {
      fetchCollections();
    }
  }, [memoisedNFTRequests, chainId]);

  return collectionsMetadata;
}
