import { InternalAccount } from '@metamask/keyring-internal-api';
import { Nft } from '@metamask/assets-controllers';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';

// This is fine to use it in send flow - might be removed in the future
// eslint-disable-next-line no-restricted-syntax
import { getNftsByChainByAccount } from '../../../../selectors/nft';
import {
  getAccountGroupWithInternalAccounts,
  getSelectedAccountGroup,
} from '../../../../selectors/multichain-accounts/account-tree';
import { getInternalAccounts } from '../../../../selectors';
import { type Asset, AssetStandard } from '../../types/send';
import { useChainNetworkNameAndImageMap } from '../useChainNetworkNameAndImage';
import { useERC1155BalanceChecker } from './useERC1155BalanceChecker';

export const useSendNfts = () => {
  const chainNetworkNAmeAndImageMap = useChainNetworkNameAndImageMap();
  const nftsOwnedByAccounts = useSelector(getNftsByChainByAccount);
  const [nfts, setNfts] = useState<Asset[]>([]);
  const { fetchBalanceForNft } = useERC1155BalanceChecker();
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const accountGroupWithInternalAccounts = useSelector(
    getAccountGroupWithInternalAccounts,
  );

  // Memoize the transformed NFTs to prevent unnecessary recalculations
  const transformedNfts = useMemo(() => {
    const selectedAccountGroupWithInternalAccounts =
      accountGroupWithInternalAccounts?.find(
        (accountGroup) => accountGroup.id === selectedAccountGroup,
      )?.accounts;

    return transformNftsToAssets(
      nftsOwnedByAccounts,
      selectedAccountGroupWithInternalAccounts as InternalAccount[],
      chainNetworkNAmeAndImageMap,
    );
  }, [
    // using accountGroupWithInternalAccounts as dependency is somehow causing repeated renders
    accountGroupWithInternalAccounts?.length,
    chainNetworkNAmeAndImageMap,
    nftsOwnedByAccounts,
    selectedAccountGroup,
  ]);

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
  nftsOwnedByAccounts: ReturnType<typeof getNftsByChainByAccount>,
  internalAccounts: ReturnType<typeof getInternalAccounts>,
  chainNetworkNAmeAndImageMap: ReturnType<
    typeof useChainNetworkNameAndImageMap
  >,
): Asset[] {
  const nftsArray: Asset[] = [];

  Object.keys(nftsOwnedByAccounts).forEach((accountAddress) => {
    const account = internalAccounts?.find(
      (acc) => acc.address === accountAddress,
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
