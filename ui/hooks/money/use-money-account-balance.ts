import { useQuery } from '@metamask/react-data-query';
import type { CanonicalMoneyAccountBalanceResponse } from '@metamask/money-account-balance-service';
import type { UseQueryResult } from '@tanstack/react-query';
import { MUSD_DECIMALS } from '@metamask/money-account-utils';
import type { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { useFiatFormatter } from '../useFiatFormatter';
import { MoneyAccountBalanceServiceQueryKeys } from './query-keys';

const DEFAULT_REFETCH_INTERVAL = 30_000;

/**
 * Fetches and formats the canonical Money Account balance.
 *
 * @param address - The SRP-derived Money Account address.
 * @returns The query state and formatted USD balance.
 */
export function useMoneyAccountBalance(address?: Hex) {
  const formatUsd = useFiatFormatter({ overrideCurrency: 'USD' });
  const query = useQuery({
    queryKey: [
      MoneyAccountBalanceServiceQueryKeys.FetchBalanceWithFallback,
      address as string,
    ],
    enabled: Boolean(address),
    refetchInterval: DEFAULT_REFETCH_INTERVAL,
  }) as UseQueryResult<CanonicalMoneyAccountBalanceResponse>;

  const balance = (() => {
    if (!query.data?.totalBalance) {
      return query.isLoading || query.isError ? undefined : new BigNumber(0);
    }

    return new BigNumber(query.data.totalBalance).shift(-MUSD_DECIMALS);
  })();

  return {
    query,
    balance,
    formattedBalance: balance?.isFinite()
      ? formatUsd(balance.toNumber())
      : undefined,
  };
}
