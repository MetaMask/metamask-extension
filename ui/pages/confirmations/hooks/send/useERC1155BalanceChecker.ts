import { useCallback } from 'react';

import {
  findNetworkClientIdByChainId,
  getERC1155BalanceOf,
} from '../../../../store/actions';
import { Asset, AssetStandard } from '../../types/send';

const BN_WORD_SIZE_IN_BITS = 26n;
const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE_INTEGER_BIGINT = BigInt(Number.MIN_SAFE_INTEGER);

type BalanceWithWords = {
  words?: unknown;
};

const wordsToBigInt = (words: unknown): bigint => {
  if (!Array.isArray(words)) {
    return 0n;
  }

  return words.reduce((value, word, index) => {
    if (typeof word !== 'number' || !Number.isFinite(word) || word < 0) {
      return value;
    }

    const normalizedWord = BigInt(Math.trunc(word));
    const bitOffset = BigInt(index) * BN_WORD_SIZE_IN_BITS;

    return value + normalizedWord * 2n ** bitOffset;
  }, 0n);
};

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

const getBalanceValue = (
  balance: string | BalanceWithWords,
): number | string => {
  let parsedBalance = 0n;

  if (typeof balance === 'string') {
    try {
      parsedBalance = parseHexLikeStringToBigInt(balance);
    } catch {
      parsedBalance = 0n;
    }
  } else if (balance && typeof balance === 'object' && 'words' in balance) {
    // Reconstruct from BN internal structure (Firefox case)
    // BN stores value in `words` array as base-2^26 limbs.
    parsedBalance = wordsToBigInt(balance.words);
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
        balance: getBalanceValue(
          balance as unknown as string | BalanceWithWords,
        ),
      };
    } catch (error) {
      console.error('Error fetching ERC1155 balance:', error);
      return null;
    }
  }, []);

  return { fetchBalanceForNft };
};
