import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { isStrictHexString } from '@metamask/utils';

import {
  getUseExternalServices,
  getUseSafeChainsListValidation,
} from '../../../selectors';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { CHAIN_SPEC_URL } from '../../../../shared/constants/network';
import { DAY } from '../../../../shared/constants/time';
import { hexToDecimal } from '../../../../shared/lib/conversion.utils';

export type SafeChain = {
  chainId: string;
  name: string;
  nativeCurrency: { symbol: string };
  rpc: string[];
};

type SafeChainsState = {
  safeChains?: SafeChain[];
  error?: Error;
};

let safeChainsState: SafeChainsState = { safeChains: [] };
let safeChainsRequest: Promise<SafeChainsState> | null = null;
let safeChainsCacheTime = 0;

const safeChainsSubscribers = new Set<(state: SafeChainsState) => void>();

const notifySafeChainsSubscribers = () => {
  for (const subscriber of safeChainsSubscribers) {
    subscriber(safeChainsState);
  }
};

const loadSafeChains = () => {
  if (
    safeChainsCacheTime &&
    Date.now() - safeChainsCacheTime < DAY &&
    safeChainsState.safeChains
  ) {
    notifySafeChainsSubscribers();
    return Promise.resolve(safeChainsState);
  }

  if (!safeChainsRequest) {
    safeChainsRequest = fetchWithCache({
      url: CHAIN_SPEC_URL,
      functionName: 'getSafeChainsList',
      allowStale: true,
      cacheOptions: { cacheRefreshTime: DAY },
    })
      .then(
        (response): SafeChainsState => ({
          safeChains: response as SafeChain[],
        }),
      )
      .catch((error: Error): SafeChainsState => ({ error }))
      .then((nextState) => {
        safeChainsState = nextState;
        if (nextState.safeChains) {
          safeChainsCacheTime = Date.now();
        }
        notifySafeChainsSubscribers();
        return nextState;
      })
      .finally(() => {
        safeChainsRequest = null;
      });
  }

  return safeChainsRequest;
};

type UseSafeChainsOptions = {
  /**
   * Load Chainlist even when network-details validation is off.
   * Basic functionality still has to be on. Chainlist is a third-party API.
   */
  enabled?: boolean;
};

export const useSafeChains = ({ enabled }: UseSafeChainsOptions = {}) => {
  const useSafeChainsListValidation = useSelector(
    getUseSafeChainsListValidation,
  );
  const useExternalServices = useSelector(getUseExternalServices);
  const shouldLoad =
    Boolean(useExternalServices) &&
    (Boolean(enabled) || useSafeChainsListValidation);

  const [safeChains, setSafeChains] = useState<SafeChainsState>(() =>
    shouldLoad ? safeChainsState : { safeChains: [] },
  );
  const [prevShouldLoad, setPrevShouldLoad] = useState(shouldLoad);

  if (shouldLoad !== prevShouldLoad) {
    setPrevShouldLoad(shouldLoad);
    setSafeChains(shouldLoad ? safeChainsState : { safeChains: [] });
  }

  useEffect(() => {
    if (!shouldLoad) {
      return undefined;
    }

    safeChainsSubscribers.add(setSafeChains);
    loadSafeChains().catch(() => undefined);

    return () => {
      safeChainsSubscribers.delete(setSafeChains);
    };
  }, [shouldLoad]);

  return safeChains;
};

export const resetSafeChainsCacheForTesting = () => {
  safeChainsState = { safeChains: [] };
  safeChainsRequest = null;
  safeChainsCacheTime = 0;
  safeChainsSubscribers.clear();
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
