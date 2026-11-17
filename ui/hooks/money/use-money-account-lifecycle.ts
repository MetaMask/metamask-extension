import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import log from 'loglevel';
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
  const [refreshedAddress, setRefreshedAddress] = useState<string>();

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
  // another device is picked up without blocking surfaces that already know
  // their lifecycle.
  useEffect(() => {
    if (!address) {
      return undefined;
    }

    let cancelled = false;

    const refresh = async () => {
      try {
        await submitRequestToBackground(REFRESH_ACTION);
      } catch (error) {
        log.debug('[Money Account] Lifecycle refresh failed', error);
      }

      if (cancelled) {
        return;
      }

      await refetch().catch(() => undefined);
      setRefreshedAddress(address);
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
    isLoading:
      Boolean(address) &&
      (query.isLoading ||
        (lifecycle === undefined && refreshedAddress !== address)),
  };
}
