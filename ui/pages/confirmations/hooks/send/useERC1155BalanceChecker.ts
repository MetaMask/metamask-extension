import { useCallback } from 'react';
import BN from 'bn.js';

import {
  findNetworkClientIdByChainId,
  getERC1155BalanceOf,
} from '../../../../store/actions';
import { Asset, AssetStandard } from '../../types/send';

const getBalanceValue = async (
  balance: string | { words: string } | Function,
) => {
  let balanceStr: string;
  if (typeof balance === 'string') {
    balanceStr = parseInt(balance, 16).toString();
  } else if (balance && typeof balance === 'object' && 'words' in balance) {
    // Reconstruct from BN internal structure (Firefox case)
    // BN stores value in `words` array as base-2^26 limbs
    const BN = (await import('bn.js')).default;
    balanceStr = new BN(balance.words, 'le').toString(10);
  } else {
    balanceStr = '0';
  }
  return parseInt(balanceStr, 10);
};

export const useERC1155BalanceChecker = () => {
  const fetchBalanceForNft = useCallback(async (nft: Asset) => {
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

      const balanceValue = await getBalanceValue(balance);

      return { nft, balance: balanceValue };
    } catch (error) {
      console.error('Error fetching ERC1155 balance:', error);
      return null;
    }
  }, []);

  return { fetchBalanceForNft };
};
