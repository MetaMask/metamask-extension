import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { CHAIN_SPEC_URL } from '../../../../shared/constants/network';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { DAY } from '../../../../shared/constants/time';
import { useAsyncResult } from '../../../hooks/useAsyncResult';
import { useSafeChainsListValidationSelector } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type SafeChainListChain = {
  chainId: number;
  nativeCurrency?: {
    symbol: string;
  };
};

export type SafeChainValidationResult = {
  enabled: boolean;
  matchedChain?: SafeChainListChain;
  currencySymbolWarning: string | null;
  error?: Error;
  isComplete: boolean;
};

export function useSafeChainValidation({
  chainId,
  ticker,
  enabled,
}: {
  chainId: Hex;
  ticker: string;
  enabled?: boolean;
}) {
  const t = useI18nContext();

  const useSafeChainsListValidation =
    useSelector(useSafeChainsListValidationSelector) && enabled !== false;

  const { error, value } = useAsyncResult(async () => {
    if (!useSafeChainsListValidation) {
      return undefined;
    }

    return await getSafeChainList();
  }, [useSafeChainsListValidation]);

  const matchedChain = value?.find(
    (chain) => chain.chainId === parseInt(chainId, 16),
  );

  const matchedChainSymbol = matchedChain?.nativeCurrency?.symbol;

  const currencySymbolWarning =
    matchedChainSymbol?.toLowerCase() === ticker?.toLowerCase()
      ? null
      : t('chainListReturnedDifferentTickerSymbol', [matchedChainSymbol]);

  return {
    enabled: useSafeChainsListValidation,
    currencySymbolWarning,
    error,
    isComplete: Boolean(value),
    matchedChain,
  };
}

async function getSafeChainList() {
  return (await fetchWithCache({
    url: CHAIN_SPEC_URL,
    allowStale: true,
    cacheOptions: { cacheRefreshTime: DAY },
    functionName: 'getSafeChainsList',
  })) as SafeChainListChain[];
}
