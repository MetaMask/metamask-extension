import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@metamask/react-data-query';
import type { CanonicalMoneyAccountBalanceResponse } from '@metamask/money-account-balance-service';
import { MoneyAccountBalanceServiceQueryKeys } from '../../../shared/lib/money/query-keys';
import { projectWithdrawableFiat } from '../../helpers/money/withdrawable-balance';
import { selectPrimaryMoneyAccount } from '../../selectors/money-account';

const DEFAULT_REFETCH_INTERVAL = 30 * 1000;

/**
 * Disabled query key used when the caller does not need money-account balance.
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
  throw new Error(
    'disabled money-account withdrawable-fiat query executed unexpectedly',
  );
}

export type MoneyAccountWithdrawableFiat = {
  withdrawableFiatFormatted: string | undefined;
  withdrawableFiatRaw: string | undefined;
};

/**
 * Live withdrawable money-account fiat for confirmation surfaces that cannot
 * use `useMoneyAccountBalance` (that hook needs a money-account route
 * messenger).
 *
 * When `isActive`, this fetches and periodically refetches the same
 * `fetchBalanceWithFallback` query money home writes. When inactive, a
 * disabled query key is used so unrelated confirmations (typed-sign, etc.) do
 * not open a data-service subscription.
 *
 * @param isActive - When false, disables the query and returns both fields as
 * `undefined`.
 * @returns Always an object. When inactive, loading, errored, or missing data,
 * both `withdrawableFiatFormatted` and `withdrawableFiatRaw` are `undefined`.
 */
export function useMoneyAccountWithdrawableFiat(
  isActive: boolean,
): MoneyAccountWithdrawableFiat {
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
    // Only the disabled key needs a queryFn. The fetch key is owned by
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
        withdrawableFiatFormatted: undefined,
        withdrawableFiatRaw: undefined,
      };
    }

    return projectWithdrawableFiat(moneyBalanceQuery.data.vmusdValueInMusd);
  }, [
    isActive,
    moneyBalanceQuery.data,
    moneyBalanceQuery.isError,
    moneyBalanceQuery.isLoading,
  ]);
}
