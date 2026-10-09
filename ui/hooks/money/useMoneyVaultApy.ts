import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@metamask/react-data-query';
import type { NormalizedVaultApyResponse } from '@metamask/money-account-balance-service';
import { MoneyAccountBalanceServiceQueryKeys } from '../../../shared/lib/money/query-keys';
import {
  clearReportedMoneyQueryError,
  reportMoneyQueryErrorOnce,
} from '../../helpers/money/report-money-error';
import { selectMoneyVaultApyRemoteConfig } from '../../selectors/money/money-account-feature-flags';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/** Percentage points per unit of a decimal rate. */
const PERCENT = 100;

/** Decimal places the APY percentage is presented to. */
const APY_PERCENT_DP = 1;

export type UseMoneyVaultApyResult = {
  vaultApyQuery: UseQueryResult<NormalizedVaultApyResponse>;
  apyDecimal: number | undefined;
  apyPercent: number | undefined;
  apyPercentFormatted: string | undefined;
};

/**
 * @param options - Query controls.
 * @param options.enabled - Whether to fetch the live APY.
 * @returns The Money vault APY, with the remote override and fallback applied.
 */
export function useMoneyVaultApy({
  enabled,
}: {
  enabled: boolean;
}): UseMoneyVaultApyResult {
  const { vaultApyFallback, vaultApyOverride } = useSelector(
    selectMoneyVaultApyRemoteConfig,
  );

  const vaultApyQuery = useQuery<NormalizedVaultApyResponse>({
    queryKey: [MoneyAccountBalanceServiceQueryKeys.GET_VAULT_APY],
    enabled,
    refetchInterval: FIVE_MINUTES_MS,
  });

  useEffect(() => {
    if (!vaultApyQuery.isError) {
      clearReportedMoneyQueryError('getVaultApy');
      return;
    }
    reportMoneyQueryErrorOnce(
      'getVaultApy',
      '[Money Account] Vault APY fetch failed',
      vaultApyQuery.error,
      { query: 'getVaultApy' },
    );
  }, [vaultApyQuery.error, vaultApyQuery.isError]);

  const serviceApy = vaultApyQuery.data?.apy;

  // Override always wins when set; otherwise use the live service value, then
  // the configured fallback so projected earnings remain available on load.
  const apyDecimal = vaultApyOverride ?? serviceApy ?? vaultApyFallback;

  const apyPercent =
    apyDecimal === undefined
      ? undefined
      : // `.toString()` because `bignumber.js@4` throws on a *number* argument
        // with more than 15 significant digits, and live service APYs carry
        // full float precision (e.g. 0.06632893279913232). Strings are exempt.
        new BigNumber(apyDecimal.toString())
          .times(PERCENT)
          // `round(dp, rm)`, not mobile's `dp(dp, rm)`: in `bignumber.js@4`
          // `decimalPlaces`/`dp` is a getter that ignores both arguments and
          // returns the decimal-place *count* — it would silently yield a
          // nonsense percentage rather than failing.
          .round(APY_PERCENT_DP, BigNumber.ROUND_HALF_UP)
          .toNumber();

  const apyPercentFormatted =
    apyPercent === undefined ? undefined : `${apyPercent}%`;

  return { vaultApyQuery, apyDecimal, apyPercent, apyPercentFormatted };
}
