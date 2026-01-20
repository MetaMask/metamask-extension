import { CaipChainId, Hex } from '@metamask/utils';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION,
  CHAIN_SPEC_URL,
} from '../../../shared/constants/network';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { DAY } from '../../../shared/constants/time';

export const getOriginalNativeTokenSymbol = async ({
  chainId,
  useAPICall = false,
}: {
  chainId: Hex | CaipChainId;
  useAPICall?: boolean;
}): Promise<string | null> => {
  try {
    const mappedCurrencySymbol =
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        chainId as Hex as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ];
    if (mappedCurrencySymbol) {
      return mappedCurrencySymbol;
    }

    const mappedAsNetworkCollision =
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION[
        chainId as Hex as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION
      ];

    if (mappedAsNetworkCollision?.[0].currencySymbol) {
      return mappedAsNetworkCollision[0].currencySymbol;
    }

    if (!useAPICall) {
      return null;
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

    return matchedChain?.nativeCurrency?.symbol ?? null;
  } catch (err) {
    return null;
  }
};

export const isOriginalNativeTokenSymbol = async ({
  ticker,
  chainId,
  useAPICall = false,
}: {
  ticker: string;
  chainId: Hex | CaipChainId;
  useAPICall?: boolean;
}) => {
  const originalNativeTokenSymbol = await getOriginalNativeTokenSymbol({
    chainId,
    useAPICall,
  });

  // No original symbol found, so we can assume the ticker provided is correct.
  if (originalNativeTokenSymbol === null) {
    return true;
  }

  // Validate that the ticker uses the correct/expected ticker symbol
  return originalNativeTokenSymbol === ticker;
};
