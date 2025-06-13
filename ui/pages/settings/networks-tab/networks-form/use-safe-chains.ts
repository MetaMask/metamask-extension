import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { isStrictHexString } from '@metamask/utils';

import { useSafeChainsListValidationSelector } from '../../../../selectors';
import fetchWithCache from '../../../../../shared/lib/fetch-with-cache';
import { CHAIN_SPEC_URL } from '../../../../../shared/constants/network';
import { DAY } from '../../../../../shared/constants/time';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';

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

  useEffect(() => {
    if (useSafeChainsListValidation) {
      fetchWithCache({
        url: CHAIN_SPEC_URL,
        functionName: 'getSafeChainsList',
        allowStale: true,
        cacheOptions: { cacheRefreshTime: DAY },
      })
        .then((response) => {
          setSafeChains({ safeChains: response });
        })
        .catch((error) => {
          setSafeChains({ error });
        });
    }
  }, [useSafeChainsListValidation]);

  return safeChains;
};

export const getSafeNativeCurrencySymbol = (
  safeChains?: SafeChain[],
  chainId?: string,
) => {
  if (!safeChains || !chainId) {
    return undefined;
  }

  const decimalChainId =
    isStrictHexString(chainId) && parseInt(hexToDecimal(chainId), 10);

  if (typeof decimalChainId !== 'number') {
    return undefined;
  }

  return safeChains.find((chain) => chain.chainId === decimalChainId.toString())
    ?.nativeCurrency?.symbol;
};

export const rpcIdentifierUtility = (
  rpcUrl: string,
  safeChains: SafeChain[],
) => {
  const { host } = new URL(rpcUrl);

  for (const chain of safeChains) {
    for (const rpc of chain.rpc) {
      try {
        if (host === new URL(rpc).host) {
          return host;
        }
      } catch {
        continue;
      }
    }
  }

  return 'Unknown rpcUrl';
};
