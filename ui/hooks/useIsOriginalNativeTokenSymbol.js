import { useEffect, useState } from 'react';
import fetchWithCache from '../../shared/lib/fetch-with-cache';
import { BUILT_IN_NETWORKS } from '../../shared/constants/network';

export function useIsOriginalNativeTokenSymbol(chainId, ticker, type) {
  const [isOriginalNativeSymbol, setIsOriginalNativeSymbol] = useState(null);

  useEffect(() => {
    async function getNativeTokenSymbol(networkId) {
      try {
        const matchedSymbolBuiltInNetwork =
          BUILT_IN_NETWORKS[type]?.ticker ?? null;
        if (matchedSymbolBuiltInNetwork) {
          setIsOriginalNativeSymbol(matchedSymbolBuiltInNetwork === ticker);
          return matchedSymbolBuiltInNetwork === ticker;
        }

        const safeChainsList = await fetchWithCache({
          url: 'https://chainid.network/chains.json',
          functionName: 'getSafeChainsList',
        });

        const matchedChain = safeChainsList.find(
          (network) => network.chainId === parseInt(networkId, 16),
        );

        const symbol = matchedChain?.nativeCurrency?.symbol ?? null;

        setIsOriginalNativeSymbol(symbol === ticker);
        return symbol === ticker;
      } catch (err) {
        return null;
      }
    }

    getNativeTokenSymbol(chainId);
  }, [isOriginalNativeSymbol, chainId, ticker, type]);

  return isOriginalNativeSymbol;
}
