import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MoneyAccountLifecycle } from '@metamask/money-account-lifecycle-controller';
import { submitRequestToBackground } from '../../store/background-connection';
import { useMoneyAccountAvailability } from './use-money-account-availability';
import { MoneyAccountLifecycleControllerQueryKeys } from './query-keys';

export type UseMoneyAccountLifecycleResult = {
  lifecycle: MoneyAccountLifecycle | undefined;
  isReadOnly: boolean;
  isLoading: boolean;
};

const REFRESH_ACTION = MoneyAccountLifecycleControllerQueryKeys.Refresh;

/**
 * Reads the primary Money Account's lifecycle and reports whether it can still
 * be used for deposits and withdrawals.
 *
 * A Money Account that is an identity's previous address (`mfa`) or whose
 * migration is in flight (`migrating`) is read-only: CHOMP has moved or is
 * moving its funds to the MFA address.
 *
 * @returns The lifecycle, its read-only state, and the first-read loading flag.
 */
export function useMoneyAccountLifecycle(): UseMoneyAccountLifecycleResult {
  const { availability } = useMoneyAccountAvailability();
  const address = availability.isAvailable ? availability.address : undefined;

  const query = useQuery({
    queryKey: [MoneyAccountLifecycleControllerQueryKeys.GetState, address],
    queryFn: () =>
      submitRequestToBackground(
        MoneyAccountLifecycleControllerQueryKeys.GetState,
      ),
    enabled: Boolean(address),
    refetchOnMount: 'always',
  });

  const { refetch } = query;

  // Read the recorded state first, then refresh it so a migration performed on
  // another device is picked up without blocking the first paint.
  useEffect(() => {
    if (!address) {
      return undefined;
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        await submitRequestToBackground(REFRESH_ACTION);
      } catch {
        return;
      }

      if (!cancelled) {
        await refetch().catch(() => undefined);
      }
    };
    refresh();

    return () => {
      cancelled = true;
    };
  }, [address, refetch]);

  const lifecycle = address
    ? query.data?.moneyAccounts[address.toLowerCase()]
    : undefined;
  const isReadOnly =
    lifecycle?.type === 'mfa' || lifecycle?.type === 'migrating';

  return {
    lifecycle,
    isReadOnly,
    isLoading: Boolean(address) && query.isLoading,
  };
}
