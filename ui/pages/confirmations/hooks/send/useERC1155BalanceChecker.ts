import { useDispatch } from 'react-redux';
import { useCallback } from 'react';

import {
  findNetworkClientIdByChainId,
  getERC1155BalanceOf,
} from '../../../../store/actions';
import { Asset, AssetStandard } from '../../types/send';

export const useERC1155BalanceChecker = () => {
  const dispatch = useDispatch();

  const fetchBalanceForNft = useCallback(
    async (nft: Asset) => {
      if (nft.standard !== AssetStandard.ERC1155) {
        return null;
      }

      try {
        const networkClientId = await findNetworkClientIdByChainId(
          nft.chainId as string,
        );

        const balance = await getERC1155BalanceOf(
          nft.accountAddress as string,
          nft.address as string,
          nft.tokenId as string,
          networkClientId,
        );

        return { nft, balance: Number(balance) };
      } catch (error) {
        console.error('Error fetching ERC1155 balance:', error);
        return null;
      }
    },
    [dispatch],
  );

  return { fetchBalanceForNft };
};
