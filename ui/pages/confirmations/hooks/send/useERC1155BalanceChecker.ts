import { useCallback } from 'react';

import {
  findNetworkClientIdByChainId,
  getERC1155BalanceOf,
} from '../../../../store/actions';
import { Asset, AssetStandard } from '../../types/send';

const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE_INTEGER_BIGINT = BigInt(Number.MIN_SAFE_INTEGER);

const parseHexLikeStringToBigInt = (balance: string): bigint => {
  const normalizedBalance = balance.trim();

  if (!normalizedBalance) {
    return 0n;
  }

  if (
    normalizedBalance.startsWith('0x') ||
    normalizedBalance.startsWith('-0x')
  ) {
    return BigInt(normalizedBalance);
  }

  // Keep existing behavior: plain strings are interpreted as hexadecimal.
  return BigInt(`0x${normalizedBalance}`);
};

const getBalanceValue = (balance: string): number | string => {
  let parsedBalance = 0n;
  try {
    parsedBalance = parseHexLikeStringToBigInt(balance);
  } catch {
    parsedBalance = 0n;
  }

  if (
    parsedBalance >= MIN_SAFE_INTEGER_BIGINT &&
    parsedBalance <= MAX_SAFE_INTEGER_BIGINT
  ) {
    return Number(parsedBalance);
  }

  return parsedBalance.toString(10);
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

      return {
        nft,
        balance: getBalanceValue(balance),
      };
    } catch (error) {
      console.error('Error fetching ERC1155 balance:', error);
      return null;
    }
  }, []);

  return { fetchBalanceForNft };
};
