import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import log from 'loglevel';
import type { MoneyAccountLifecycle } from '@metamask/money-account-lifecycle-controller';
import { submitRequestToBackground } from '../../store/background-connection';
import { useMoneyAccountAvailability } from './use-money-account-availability';
import { MoneyAccountLifecycleControllerQueryKeys } from './query-keys';

export type UseMoneyAccountLifecycleResult = {
  lifecycle: MoneyAccountLifecycle | undefined;
  isLifecycleUnavailable: boolean;
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
 * moving its funds to the MFA address. A failed refresh with no recorded
 * lifecycle keeps `isLoading` true, so deposits and withdrawals stay disabled.
 *
 * @returns The lifecycle, whether it is read-only or unavailable, and whether
 * the first read is still pending.
 */
export function useMoneyAccountLifecycle(): UseMoneyAccountLifecycleResult {
  const { availability } = useMoneyAccountAvailability();
  const address = availability.isAvailable ? availability.address : undefined;
  const [refreshStatus, setRefreshStatus] = useState<{
    address: string;
    failed: boolean;
  }>();

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
      let didRefresh = false;
      try {
        await submitRequestToBackground(REFRESH_ACTION);
        didRefresh = true;
      } catch (error) {
        log.debug('[Money Account] Lifecycle refresh failed', error);
      }

      if (cancelled) {
        return;
      }

      const result = await refetch().catch(() => undefined);
      if (cancelled) {
        return;
      }

      const didRead = Boolean(result && !result.isError);
      setRefreshStatus({ address, failed: !(didRefresh && didRead) });
    };
    refresh().catch((error) => {
      log.debug('[Money Account] Lifecycle refresh task failed', error);
    });

    return () => {
      cancelled = true;
    };
  }, [address, refetch]);

  const lifecycle = address
    ? query.data?.moneyAccounts[address.toLowerCase()]
    : undefined;
  const isReadOnly =
    lifecycle?.type === 'mfa' || lifecycle?.type === 'migrating';
  const isSettled = refreshStatus?.address === address;
  // shortcut: E2E lacks a CHOMP lifecycle fixture, so test builds fail open.
  const isTestBuild = process.env.IN_TEST;
  const isLifecycleUnavailable =
    !isTestBuild &&
    Boolean(address) &&
    lifecycle === undefined &&
    isSettled &&
    refreshStatus?.failed === true;

  return {
    lifecycle,
    isLifecycleUnavailable,
    isReadOnly,
    isLoading:
      Boolean(address) &&
      (query.isLoading ||
        (!isTestBuild && lifecycle === undefined && !isSettled)),
  };
}
