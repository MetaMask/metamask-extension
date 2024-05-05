import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import fetchWithCache from '../../shared/lib/fetch-with-cache';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION,
} from '../../shared/constants/network';
import { DAY } from '../../shared/constants/time';
import { useSafeChainsListValidationSelector } from '../selectors';
import { getValidUrl } from '../../app/scripts/lib/util';

export function useIsOriginalNativeTokenSymbol(
  chainId,
  ticker,
  type,
  rpcUrl = null,
) {
  const [isOriginalNativeSymbol, setIsOriginalNativeSymbol] = useState(null);
  const useSafeChainsListValidation = useSelector(
    useSafeChainsListValidationSelector,
  );

  const isLocalhost = (urlString) => {
    const url = getValidUrl(urlString);

    return (
      url !== null &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    );
  };

  useEffect(() => {
    async function getNativeTokenSymbol(networkId) {
      try {
        if (!useSafeChainsListValidation) {
          setIsOriginalNativeSymbol(true);
          return;
        }

        // exclude local dev network
        if (isLocalhost(rpcUrl)) {
          setIsOriginalNativeSymbol(true);
          return;
        }

        const mappedCurrencySymbol = CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[chainId];
        if (mappedCurrencySymbol) {
          setIsOriginalNativeSymbol(mappedCurrencySymbol === ticker);
          return;
        }

        const mappedAsNetworkCollision =
          CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION[chainId];

        const isMappedCollision =
          mappedAsNetworkCollision &&
          mappedAsNetworkCollision.some(
            (network) => network.currencySymbol === ticker,
          );

        if (isMappedCollision) {
          setIsOriginalNativeSymbol(true);
          return;
        }

        const safeChainsList = await fetchWithCache({
          url: 'https://chainid.network/chains.json',
          cacheOptions: { cacheRefreshTime: DAY },
          functionName: 'getSafeChainsList',
        });

        const matchedChain = safeChainsList.find(
          (network) => network.chainId === parseInt(networkId, 16),
        );

        const symbol = matchedChain?.nativeCurrency?.symbol ?? null;

        setIsOriginalNativeSymbol(symbol === ticker);
      } catch (err) {
        setIsOriginalNativeSymbol(false);
      }
    }

    getNativeTokenSymbol(chainId);
  }, [
    isOriginalNativeSymbol,
    chainId,
    ticker,
    type,
    rpcUrl,
    useSafeChainsListValidation,
  ]);

  return isOriginalNativeSymbol;
}
