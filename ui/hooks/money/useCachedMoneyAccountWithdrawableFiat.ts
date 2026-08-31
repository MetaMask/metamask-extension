import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import { useQuery } from '@metamask/react-data-query';
import { MUSD_DECIMALS } from '@metamask/money-account-utils';
import type { CanonicalMoneyAccountBalanceResponse } from '@metamask/money-account-balance-service';
import { MoneyAccountBalanceServiceQueryKeys } from '../../../shared/lib/money/query-keys';
import { moneyFormatUsd } from '../../helpers/money/format';
import { selectPrimaryMoneyAccount } from '../../selectors/money-account';

const MUSD_UNIT = 10 ** MUSD_DECIMALS;

const DEFAULT_REFETCH_INTERVAL = 30 * 1000;

/**
 * Inert query key used when the caller does not need money-account balance.
 * Deliberately not a `DATA_SERVICES` name so the query client does not open a
 * background messenger subscription for it.
 */
const DISABLED_QUERY_KEY = 'money-account-withdrawable-fiat:disabled';

/**
 * Never-run `queryFn` for {@link DISABLED_QUERY_KEY}. TanStack Query logs
 * "No queryFn was found" for observers that omit one, even when `enabled` is
 * false — and this hook runs for every confirmation via pay/alert surfaces.
 */
function disabledWithdrawableFiatQueryFn(): never {
  throw new Error('money-account-withdrawable-fiat is cache-only');
}

export type CachedMoneyAccountWithdrawableFiat = {
  withdrawableFiatRaw: string | undefined;
  withdrawableFiatFormatted: string | undefined;
};

/**
 * Withdrawable money-account fiat for confirmation surfaces that cannot use
 * `useMoneyAccountBalance` (that hook needs a money-account route messenger).
 *
 * When `isActive`, this fetches the same
 * `fetchBalanceWithFallback` query money home writes. Perps deposit never
 * visits money home first, so cache-only reads left the Pay-with row and
 * modal blank. A dummy query key is used when inactive so unrelated
 * confirmations (typed-sign, etc.) do not open a data-service subscription.
 *
 * @param isActive - When false, uses a dummy query key and returns undefined.
 * @returns Withdrawable fiat, or undefined when inactive / unavailable.
 */
export function useCachedMoneyAccountWithdrawableFiat(
  isActive: boolean,
): CachedMoneyAccountWithdrawableFiat {
  const primaryMoneyAccount = useSelector(selectPrimaryMoneyAccount);
  const address = primaryMoneyAccount?.address;
  const shouldFetch = Boolean(isActive && address);

  const moneyBalanceQuery = useQuery<CanonicalMoneyAccountBalanceResponse>({
    queryKey: shouldFetch
      ? [
          MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
          address ?? '',
        ]
      : [DISABLED_QUERY_KEY],
    enabled: shouldFetch,
    refetchInterval: shouldFetch ? DEFAULT_REFETCH_INTERVAL : false,
    // Only the dummy key needs a queryFn. The fetch key is owned by
    // DATA_SERVICES; attaching a local queryFn would overwrite that handler.
    ...(shouldFetch ? {} : { queryFn: disabledWithdrawableFiatQueryFn }),
  });

  return useMemo(() => {
    if (
      !isActive ||
      moneyBalanceQuery.isLoading ||
      moneyBalanceQuery.isError ||
      !moneyBalanceQuery.data?.vmusdValueInMusd
    ) {
      return {
        withdrawableFiatRaw: undefined,
        withdrawableFiatFormatted: undefined,
      };
    }

    const withdrawableFiat = new BigNumber(
      moneyBalanceQuery.data.vmusdValueInMusd,
    ).dividedBy(MUSD_UNIT);

    return {
      withdrawableFiatRaw: withdrawableFiat.toString(),
      withdrawableFiatFormatted: moneyFormatUsd(withdrawableFiat),
    };
  }, [
    isActive,
    moneyBalanceQuery.data,
    moneyBalanceQuery.isError,
    moneyBalanceQuery.isLoading,
  ]);
}
