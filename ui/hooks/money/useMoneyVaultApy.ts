import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import { useQuery } from '@metamask/react-data-query';
import type { VaultsResponse } from '@metamask/money-account-api-data-service';
import { MoneyAccountApiDataServiceQueryKeys } from '../../../shared/lib/money/query-keys';
import { isEqualCaseInsensitive } from '../../../shared/lib/string-utils';
import {
  clearReportedMoneyQueryError,
  reportMoneyQueryErrorOnce,
} from '../../helpers/money/report-money-error';
import {
  selectMoneyAccountVaultConfig,
  selectMoneyVaultApyRemoteConfig,
} from '../../selectors/money/money-account-feature-flags';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/** Percentage points per unit of a decimal rate. */
const PERCENT = 100;

/** Decimal places the APY percentage is presented to. */
const APY_PERCENT_DP = 1;

export type UseMoneyVaultApyResult = {
  isApyLoading: boolean;
  apyDecimal: number | undefined;
  apyPercent: number | undefined;
  apyPercentFormatted: string | undefined;
};

function parseCurrentApy(value: string): number | undefined {
  try {
    const apy = new BigNumber(value);
    return apy.isNaN() || !apy.isFinite() ? undefined : apy.toNumber();
  } catch {
    // `bignumber.js@4` throws on a malformed string rather than returning NaN.
    return undefined;
  }
}

/**
 * @param options - Query controls.
 * @param options.enabled - Whether to fetch the live APY.
 * @returns The Money vault APY from the vault catalog, with the remote
 * override and fallback applied.
 */
export function useMoneyVaultApy({
  enabled,
}: {
  enabled: boolean;
}): UseMoneyVaultApyResult {
  const { vaultApyFallback, vaultApyOverride } = useSelector(
    selectMoneyVaultApyRemoteConfig,
  );
  const configuredVaultAddress = useSelector(
    selectMoneyAccountVaultConfig,
  )?.boringVault;

  const vaultApyQuery = useQuery<VaultsResponse>({
    queryKey: [MoneyAccountApiDataServiceQueryKeys.FETCH_VAULTS],
    enabled,
    refetchInterval: FIVE_MINUTES_MS,
  });

  useEffect(() => {
    if (!vaultApyQuery.isError) {
      clearReportedMoneyQueryError('fetchVaults');
      return;
    }
    reportMoneyQueryErrorOnce(
      'fetchVaults',
      '[Money Account] Vault APY fetch failed',
      vaultApyQuery.error,
      { query: 'fetchVaults' },
    );
  }, [vaultApyQuery.error, vaultApyQuery.isError]);

  const vaults = vaultApyQuery.data?.vaults;
  const configuredVault = configuredVaultAddress
    ? vaults?.find(({ vault_address: vaultAddress }) =>
        isEqualCaseInsensitive(vaultAddress, configuredVaultAddress),
      )
    : undefined;
  const vault =
    configuredVault ??
    vaults?.find(({ vault_key: vaultKey }) => vaultKey === 'standard');

  const serviceApy = vault ? parseCurrentApy(vault.current_apy) : undefined;

  // Override always wins when set; otherwise use the live vault APY, then the
  // configured fallback so projected earnings remain available on load.
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

  return {
    isApyLoading: vaultApyQuery.isLoading,
    apyDecimal,
    apyPercent,
    apyPercentFormatted,
  };
}
