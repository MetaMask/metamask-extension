import { Hex } from '@metamask/utils';
import { CHAIN_SPEC_URL } from '../../../shared/constants/network';

import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION,
} from '../../../shared/constants/network';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { DAY } from '../../../shared/constants/time';

export const isOriginalNativeTokenSymbol = async ({
  ticker,
  chainId,
}: {
  ticker: string;
  chainId: Hex;
}) => {
  try {
    const mappedCurrencySymbol =
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        chainId as Hex as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ];
    if (mappedCurrencySymbol) {
      return mappedCurrencySymbol === ticker;
    }

    const mappedAsNetworkCollision =
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION[
        chainId as Hex as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION
      ];

    const isMappedCollision =
      mappedAsNetworkCollision &&
      mappedAsNetworkCollision.some(
        (network) => network.currencySymbol === ticker,
      );

    if (isMappedCollision) {
      return true;
    }

    const safeChainsList = await fetchWithCache({
      url: CHAIN_SPEC_URL,
      allowStale: true,
      cacheOptions: { cacheRefreshTime: DAY },
      functionName: 'getSafeChainsList',
    });

    const matchedChain = safeChainsList.find(
      (network: { chainId: number }) =>
        network.chainId === parseInt(chainId, 16),
    );

    const symbol = matchedChain?.nativeCurrency?.symbol ?? null;

    return symbol === ticker;
  } catch (err) {
    return false;
  }
};
