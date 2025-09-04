import { useSelector } from 'react-redux';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Nft } from '@metamask/assets-controllers';

import { getNftsByChainByAccount } from '../../../../selectors/nft';
import { getInternalAccounts } from '../../../../selectors';
import { type Asset, AssetStandard } from '../../types/send';
import { useChainNetworkNameAndImageMap } from '../useChainNetworkNameAndImage';
import { useERC1155BalanceChecker } from './useERC1155BalanceChecker';

export const useSendNfts = () => {
  const chainNetworkNAmeAndImageMap = useChainNetworkNameAndImageMap();
  const nftsOwnedByAccounts = useSelector(getNftsByChainByAccount);
  const internalAccounts = useSelector(getInternalAccounts);
  const [nfts, setNfts] = useState<Asset[]>([]);
  const { fetchBalanceForNft } = useERC1155BalanceChecker();

  // Memoize the transformed NFTs to prevent unnecessary recalculations
  const transformedNfts = useMemo(() => {
    return transformNftsToAssets(
      nftsOwnedByAccounts,
      internalAccounts,
      chainNetworkNAmeAndImageMap,
    );
  }, [nftsOwnedByAccounts, internalAccounts]);

  // Memoize the balance fetching function
  const fetchNftsWithBalances = useCallback(
    async (nftsArray: Asset[]) => {
      const erc1155Nfts = nftsArray.filter(
        (nft) => nft.standard === AssetStandard.ERC1155,
      );

      if (erc1155Nfts.length === 0) {
        return nftsArray;
      }

      const balancePromises = erc1155Nfts.map(fetchBalanceForNft);
      const balanceResults = await Promise.allSettled(balancePromises);

      const nftsWithBalances = [...nftsArray];
      balanceResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const { nft, balance } = result.value;
          const index = nftsWithBalances.findIndex(
            (prevNft) =>
              prevNft.address === nft.address &&
              prevNft.tokenId === nft.tokenId &&
              prevNft.chainId === nft.chainId &&
              prevNft.accountId === nft.accountId,
          );
          if (index !== -1) {
            nftsWithBalances[index] = { ...nftsWithBalances[index], balance };
          }
        }
      });

      return nftsWithBalances;
    },
    [fetchBalanceForNft],
  );

  useEffect(() => {
    let isCancelled = false;

    const updateNfts = async () => {
      const nftsWithBalances = await fetchNftsWithBalances(transformedNfts);

      if (!isCancelled) {
        setNfts(nftsWithBalances);
      }
    };

    updateNfts();

    return () => {
      isCancelled = true;
    };
  }, [transformedNfts, fetchNftsWithBalances]);

  return nfts;
};

function transformNftsToAssets(
  nftsOwnedByAccounts: any,
  internalAccounts: any[],
  chainNetworkNAmeAndImageMap: any,
): Asset[] {
  const nftsArray: Asset[] = [];

  Object.keys(nftsOwnedByAccounts).forEach((accountAddress) => {
    const account = internalAccounts.find(
      (account) => account.address === accountAddress,
    );

    if (account) {
      Object.keys(nftsOwnedByAccounts[accountAddress]).forEach((chainId) => {
        nftsOwnedByAccounts[accountAddress][chainId].forEach((nft: Nft) => {
          const chainNetworkNameAndImage =
            chainNetworkNAmeAndImageMap.get(chainId);
          nftsArray.push({
            ...nft,
            accountId: account.id,
            accountAddress: account.address,
            chainId,
            networkImage: chainNetworkNameAndImage?.networkImage,
            networkName: chainNetworkNameAndImage?.networkName,
          } as Asset);
        });
      });
    }
  });

  return nftsArray;
}
