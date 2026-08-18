import { useQuery } from '@metamask/react-data-query';
import type { NormalizedVaultApyResponse } from '@metamask/money-account-balance-service';
import type { UseQueryResult } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { useSelector } from 'react-redux';
import { selectMoneyVaultApyRemoteConfig } from '../../selectors/money/money-account-feature-flags';
import { MoneyAccountBalanceServiceQueryKeys } from './query-keys';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * Fetches the Money vault APY and applies remote override/fallback controls.
 *
 * @param enabled - Whether the query should run.
 * @returns The APY query and normalized display values.
 */
export function useMoneyVaultApy(enabled = true) {
  const { vaultApyFallback, vaultApyOverride } = useSelector(
    selectMoneyVaultApyRemoteConfig,
  );
  const query = useQuery({
    queryKey: [MoneyAccountBalanceServiceQueryKeys.GetVaultApy],
    enabled,
    refetchInterval: FIVE_MINUTES_MS,
  }) as UseQueryResult<NormalizedVaultApyResponse>;

  const serviceApy = query.data?.apy;
  const shouldUseFallback =
    !query.isLoading && (query.isError || serviceApy === undefined);
  const apyDecimal =
    vaultApyOverride ??
    serviceApy ??
    (shouldUseFallback ? vaultApyFallback : undefined);
  const apyPercent =
    apyDecimal === undefined
      ? undefined
      : new BigNumber(apyDecimal.toString())
          .times(100)
          .round(1, BigNumber.ROUND_HALF_UP)
          .toNumber();

  return {
    query,
    apyDecimal,
    apyPercent,
    formattedApy:
      apyPercent === undefined ? undefined : `${apyPercent.toString()}%`,
  };
}
