import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import fetchWithCache from '../../shared/lib/fetch-with-cache';
import { useSafeChainsListValidationSelector } from '../selectors';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from 'shared/constants/network';
import { DAY } from 'shared/constants/time';

export function useIsOriginalNativeTokenSymbol(chainId, ticker, type) {
  const [isOriginalNativeSymbol, setIsOriginalNativeSymbol] = useState(null);
  const useSafeChainsListValidation = useSelector(
    useSafeChainsListValidationSelector,
  );
  useEffect(() => {
    async function getNativeTokenSymbol(networkId) {
      try {
        if (!useSafeChainsListValidation) {
          setIsOriginalNativeSymbol(true);
          return;
        }

        const mappedCurrencySymbol = CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[chainId];
        if (mappedCurrencySymbol) {
          setIsOriginalNativeSymbol(mappedCurrencySymbol === ticker);
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
        return;
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
    useSafeChainsListValidation,
  ]);

  return isOriginalNativeSymbol;
}
