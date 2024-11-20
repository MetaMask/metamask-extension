import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import fetchWithCache from '../../shared/lib/fetch-with-cache';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION,
  CHAIN_SPEC_URL,
} from '../../shared/constants/network';
import { DAY } from '../../shared/constants/time';
import { useSafeChainsListValidationSelector } from '../selectors';
import {
  getMultichainIsEvm,
  getMultichainCurrentNetwork,
} from '../selectors/multichain';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getValidUrl } from '../../app/scripts/lib/util';

export function useIsOriginalNativeTokenSymbol(
  chainId,
  ticker,
  type,
  rpcUrl = '',
) {
  const [isOriginalNativeSymbol, setIsOriginalNativeSymbol] = useState(false);
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

  const isEvm = useSelector(getMultichainIsEvm);
  const providerConfig = useSelector(getMultichainCurrentNetwork);

  useEffect(() => {
    async function getNativeTokenSymbol(networkId) {
      if (!isEvm) {
        setIsOriginalNativeSymbol(ticker === providerConfig?.ticker);
        return;
      }

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
          url: CHAIN_SPEC_URL,
          allowStale: true,
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
