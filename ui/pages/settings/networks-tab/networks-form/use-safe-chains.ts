import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useSafeChainsListValidationSelector } from '../../../../selectors';
import fetchWithCache from '../../../../../shared/lib/fetch-with-cache';
import { DAY } from '../../../../../shared/constants/time';

export type SafeChain = {
  chainId: string;
  name: string;
  nativeCurrency: { symbol: string };
  rpc: string[];
};

export const useSafeChains = () => {
  const useSafeChainsListValidation = useSelector(
    useSafeChainsListValidationSelector,
  );

  const [safeChains, setSafeChains] = useState<{
    safeChains?: SafeChain[];
    error?: Error;
  }>({ safeChains: [] });

  if (useSafeChainsListValidation) {
    useEffect(() => {
      fetchWithCache({
        url: 'https://chainid.network/chains.json',
        functionName: 'getSafeChainsList',
        cacheOptions: { cacheRefreshTime: DAY },
      })
        .then((response) => {
          setSafeChains({ safeChains: response });
        })
        .catch((error) => {
          setSafeChains({ error });
        });
    }, []);
  }

  return safeChains;
};

export const rpcIdentifierUtility = (
  rpcUrl: string,
  safeChains: SafeChain[],
) => {
  const knownRpcUrls = new Set();

  safeChains.forEach((chain) => {
    chain.rpc.forEach((rpc) => {
      const sanitizedRpc = new URL(rpc).host;
      knownRpcUrls.add(sanitizedRpc);
    });
  });

  const sanitizedRpc = new URL(rpcUrl).host;
  return knownRpcUrls.has(sanitizedRpc) ? sanitizedRpc : 'Unknown rpcUrl';
};
