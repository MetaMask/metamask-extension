import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@metamask/react-data-query';
import type {
  CanonicalMoneyAccountBalanceResponse,
  NormalizedVaultApyResponse,
} from '@metamask/money-account-balance-service';
import { MoneyAccountBalanceServiceQueryKeys } from '../../../shared/lib/money/query-keys';
import { MUSD_UNIT } from '../../../shared/lib/money/withdrawable-balance';
import { moneyFormatUsd } from '../../helpers/money/format';
import { projectVmusdValueInMusdToHuman } from '../../helpers/money/withdrawable-balance';
import { invalidateMoneyAccountBalanceCaches } from '../../helpers/money/invalidate-balance-caches';
import {
  clearReportedMoneyQueryError,
  reportMoneyQueryErrorOnce,
} from '../../helpers/money/report-money-error';
import { setLastKnownMoneyBalance } from '../../ducks/money-balance';
import {
  isPersistedMoneyBalanceUsable,
  selectLastKnownMoneyBalance,
} from '../../ducks/money-balance/selectors';
import { useMoneyAccountInfo } from './useMoneyAccountInfo';
import { useMoneyVaultApy } from './useMoneyVaultApy';

const DEFAULT_REFETCH_INTERVAL = 30 * 1000; // 30 seconds

export type UseMoneyAccountBalanceResult = {
  moneyBalanceQuery: UseQueryResult<CanonicalMoneyAccountBalanceResponse>;
  vaultApyQuery: UseQueryResult<NormalizedVaultApyResponse>;
  isBalanceLoading: boolean;
  isBalanceFetchError: boolean;
  isBalanceUnavailable: boolean;
  /**
   * True when the canonical balance was served from the fallback source
   * (primary source failed and failover succeeded).
   */
  isBalanceDegraded: boolean;
  /** Provenance of the last successful balance: Money API or RPC. */
  balanceSource: 'api' | 'rpc' | undefined;
  /** Whether the last successful balance used the secondary source. */
  usedFallback: boolean;
  lastKnownTotalFiatFormatted: string | undefined;
  refetchBalance: () => Promise<void>;
  tokenTotal: BigNumber | undefined;
  totalFiatFormatted: string | undefined;
  totalFiatRaw: string | undefined;
  withdrawableFiatFormatted: string | undefined;
  withdrawableFiatRaw: string | undefined;
  withdrawableMusd: BigNumber | undefined;
  apyDecimal: number | undefined;
  apyPercent: number | undefined;
  apyPercentFormatted: string | undefined;
};

export type UseMoneyAccountBalanceOptions = {
  enabled?: boolean;
  refetchInterval?: number;
};

/**
 * @param options - Query controls.
 * @param options.enabled - Whether to fetch at all. Defaults to true.
 * @param options.refetchInterval - Balance poll interval in ms.
 * @returns The balance, the APY, and their loading/error/degraded state.
 */
export function useMoneyAccountBalance({
  enabled = true,
  refetchInterval = DEFAULT_REFETCH_INTERVAL,
}: UseMoneyAccountBalanceOptions = {}): UseMoneyAccountBalanceResult {
  const dispatch = useDispatch();
  const { primaryMoneyAccount } = useMoneyAccountInfo();
  const moneyAccountAddress = primaryMoneyAccount?.address;

  const lastKnownBalance = useSelector(selectLastKnownMoneyBalance);

  const hasAddress = Boolean(moneyAccountAddress);

  const moneyBalanceQuery = useQuery<CanonicalMoneyAccountBalanceResponse>({
    // The key must stay a `[string, ...Json[]]`, so the address is stubbed
    // while it is unknown. The query is disabled then, so the stub key is
    // never fetched against.
    queryKey: [
      MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
      moneyAccountAddress ?? '',
    ],
    enabled: enabled && hasAddress,
    refetchInterval,
  });

  const { vaultApyQuery, apyDecimal, apyPercent, apyPercentFormatted } =
    useMoneyVaultApy({ enabled: enabled && hasAddress });

  /**
   * True while the balance query is loading with no cached data (even if stale).
   */
  const isBalanceLoading = moneyBalanceQuery.isLoading;

  /** Any balance fetch failure → full error state. */
  const isBalanceFetchError = moneyBalanceQuery.isError;

  const balanceSource = moneyBalanceQuery.data?.source;
  const usedFallback = moneyBalanceQuery.data?.usedFallback === true;
  const isBalanceDegraded = usedFallback;

  useEffect(() => {
    if (!moneyBalanceQuery.isError) {
      clearReportedMoneyQueryError('fetchBalanceWithFallback');
      return;
    }
    reportMoneyQueryErrorOnce(
      'fetchBalanceWithFallback',
      '[Money Account] Balance fetch failed',
      moneyBalanceQuery.error,
      { query: 'fetchBalanceWithFallback' },
    );
  }, [moneyBalanceQuery.error, moneyBalanceQuery.isError]);

  const refetchBalance = useCallback(
    () =>
      enabled && moneyAccountAddress
        ? invalidateMoneyAccountBalanceCaches(moneyAccountAddress)
        : Promise.resolve(),
    [enabled, moneyAccountAddress],
  );

  const { tokenTotal, totalFiat, withdrawableFiat, withdrawableMusd } =
    useMemo(() => {
      // Total balance (mUSD + vmUSD) from the canonical response.
      const totalDecimal = moneyBalanceQuery.data?.totalBalance
        ? new BigNumber(moneyBalanceQuery.data.totalBalance).dividedBy(
            MUSD_UNIT,
          )
        : new BigNumber(0);

      // the withdrawable amount.
      const vmusdDecimal =
        projectVmusdValueInMusdToHuman(
          moneyBalanceQuery.data?.vmusdValueInMusd,
        ) ?? new BigNumber(0);

      // Undefined while loading or on error so callers can distinguish from a genuine zero.
      const computedWithdrawableMusd =
        isBalanceLoading || isBalanceFetchError ? undefined : vmusdDecimal;

      const computedTokenTotal =
        isBalanceLoading || isBalanceFetchError ? undefined : totalDecimal;

      // mUSD is USD-pegged 1:1, so the dollar value equals the token amount —
      // no conversion rate is needed to show the balance in dollars.
      return {
        tokenTotal: computedTokenTotal,
        totalFiat: computedTokenTotal,
        withdrawableFiat: computedWithdrawableMusd,
        withdrawableMusd: computedWithdrawableMusd,
      };
    }, [isBalanceLoading, isBalanceFetchError, moneyBalanceQuery.data]);

  const totalFiatFormatted =
    !isBalanceFetchError && totalFiat ? moneyFormatUsd(totalFiat) : undefined;

  const totalFiatRaw =
    !isBalanceFetchError && totalFiat ? totalFiat.toString() : undefined;

  const withdrawableFiatFormatted =
    !isBalanceFetchError && withdrawableFiat
      ? moneyFormatUsd(withdrawableFiat)
      : undefined;

  const withdrawableFiatRaw =
    !isBalanceFetchError && withdrawableFiat
      ? withdrawableFiat.toString()
      : undefined;

  // Persist every successful balance so it can be shown as the "last known"
  // figure (for the current account) the next time the live balance is
  // unavailable.
  useEffect(() => {
    if (
      enabled &&
      moneyAccountAddress &&
      !isBalanceFetchError &&
      !isBalanceLoading &&
      totalFiatFormatted !== undefined
    ) {
      dispatch(
        setLastKnownMoneyBalance({
          address: moneyAccountAddress,
          value: totalFiatFormatted,
          updatedAt: Date.now(),
        }),
      );
    }
  }, [
    dispatch,
    enabled,
    moneyAccountAddress,
    isBalanceFetchError,
    totalFiatFormatted,
    isBalanceLoading,
  ]);

  // True whenever there is no fresh balance to show — still loading or a fetch
  // error.
  const isBalanceUnavailable = totalFiatFormatted === undefined;

  // Last successfully fetched balance, but only when it still matches the
  // account in view; otherwise it would be misleading.
  const lastKnownTotalFiatFormatted = isPersistedMoneyBalanceUsable(
    lastKnownBalance,
    { address: moneyAccountAddress },
  )
    ? lastKnownBalance.value
    : undefined;

  return {
    moneyBalanceQuery,
    vaultApyQuery,
    isBalanceLoading,
    isBalanceFetchError,
    isBalanceUnavailable,
    isBalanceDegraded,
    balanceSource,
    usedFallback,
    lastKnownTotalFiatFormatted,
    refetchBalance,
    tokenTotal,
    totalFiatFormatted,
    totalFiatRaw,
    withdrawableFiatFormatted,
    withdrawableFiatRaw,
    withdrawableMusd,
    apyDecimal,
    apyPercent,
    apyPercentFormatted,
  };
}

export default useMoneyAccountBalance;
