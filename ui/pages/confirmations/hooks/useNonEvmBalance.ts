import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { getUseExternalServices } from '../../../selectors';
import { apiClient } from '../../../helpers/api-client';

const ZERO_RAW_BALANCE = '0';

type UseNonEvmBalanceArgs = {
  accountAddress?: string;
  assetId?: string;
  chainId?: string;
  decimals?: number;
};

export type NonEvmBalance = {
  balanceDisplay?: string;
  balanceRaw?: string;
  error?: unknown;
  isLoading: boolean;
  isLoaded: boolean;
  isSupported: boolean;
};

// POC only: fetches Solana balances directly from Accounts API to prove non-EVM
// balance retrieval does not need to be owned by the Snap. Production should move
// this into a controller/service and expose cached state through selectors.
// Supported Solana balances intentionally do not fall back to Snap-backed
// controller state; callers wait for this hook before validating/confirming.
export function useNonEvmBalance({
  accountAddress,
  assetId,
  chainId,
  decimals,
}: UseNonEvmBalanceArgs): NonEvmBalance {
  const useExternalServices = useSelector(getUseExternalServices);
  const isSupported = Boolean(chainId?.startsWith('solana:'));
  const caipAccountId =
    isSupported && chainId && accountAddress
      ? `${chainId}:${accountAddress}`
      : undefined;

  const queryOptions = useMemo(
    () =>
      apiClient.accounts.getV5MultiAccountBalancesQueryOptions(
        caipAccountId ? [caipAccountId] : [],
        chainId ? { networks: [chainId] } : undefined,
      ),
    [caipAccountId, chainId],
  );

  const query = useQuery({
    ...queryOptions,
    enabled: Boolean(
      useExternalServices && isSupported && caipAccountId && assetId,
    ),
    retry: false,
  });

  return useMemo(() => {
    if (!isSupported) {
      return {
        isLoading: false,
        isLoaded: false,
        isSupported: false,
      };
    }

    if (!query.isSuccess) {
      return {
        error: query.error,
        isLoading: query.isLoading,
        isLoaded: false,
        isSupported: true,
      };
    }

    const balance = query.data?.balances?.find(
      (entry) => entry.accountId === caipAccountId && entry.assetId === assetId,
    );
    const balanceDisplay = balance?.balance ?? '0';
    const balanceDecimals = balance?.decimals ?? decimals ?? 0;

    return {
      balanceDisplay,
      balanceRaw: toRawAmount(balanceDisplay, balanceDecimals),
      isLoading: false,
      isLoaded: true,
      isSupported: true,
    };
  }, [
    assetId,
    caipAccountId,
    decimals,
    isSupported,
    query.data,
    query.error,
    query.isLoading,
    query.isSuccess,
  ]);
}

function toRawAmount(value: string, decimals: number) {
  const valueBigNumber = new BigNumber(value);

  if (!valueBigNumber.isFinite()) {
    return ZERO_RAW_BALANCE;
  }

  return valueBigNumber.times(new BigNumber(10).pow(decimals)).toFixed(0);
}
