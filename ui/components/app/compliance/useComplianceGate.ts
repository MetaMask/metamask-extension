import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { WalletComplianceStatus } from '@metamask/compliance-controller';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  getIsComplianceEnabled,
  selectAreAnyWalletsBlocked,
} from '../../../selectors/compliance';
import { useAccessRestrictedModal } from './access-restricted-context';

type AddressInput = string | string[];

export function useComplianceGate(address?: AddressInput) {
  const addressKey = useMemo(() => {
    if (!address) {
      return '';
    }
    return Array.isArray(address) ? address.join(',') : address;
  }, [address]);

  const addresses = useMemo(
    () => (addressKey ? addressKey.split(',').filter(Boolean) : []),
    [addressKey],
  );

  const isComplianceEnabled = useSelector(getIsComplianceEnabled);
  const rawIsBlocked = useSelector(selectAreAnyWalletsBlocked(addresses));
  const { showAccessRestrictedModal } = useAccessRestrictedModal();
  const isBlocked = isComplianceEnabled && rawIsBlocked;

  // Holds the in-flight prefetch promise so gate() can await it if the user
  // acts before the prefetch has resolved.
  const prefetchRef = useRef<Promise<unknown> | null>(null);

  // Stores the resolved blocked status from the most recent prefetch.
  // Default false = fail-open: assume not blocked until the API says otherwise.
  // Reset to false at the start of each prefetch (while in-flight) so gate()
  // never reads a stale result from a previous address.
  const prefetchBlockedRef = useRef<boolean>(false);

  // Guards against an in-flight prefetch for a previous address resolving late
  // and overwriting the result for the current address.
  const requestIdRef = useRef(0);

  const checkCompliance = useCallback(async () => {
    if (addresses.length === 0) {
      return undefined;
    }

    return await submitRequestToBackground<WalletComplianceStatus[]>(
      'complianceCheckWalletsCompliance',
      [addresses],
    );
  }, [addresses]);

  // Prefetch compliance status on mount and whenever the address changes.
  // `checkCompliance` is memoized on `addresses`, so its identity changes
  // exactly when the address set changes — that (not `addresses.length`, which
  // stays constant across an account switch) is the correct re-fetch signal.
  useEffect(() => {
    if (!isComplianceEnabled) {
      prefetchBlockedRef.current = false;
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    prefetchBlockedRef.current = false; // reset while in-flight
    prefetchRef.current = checkCompliance()
      .then((results) => {
        if (requestIdRef.current === requestId) {
          prefetchBlockedRef.current =
            results?.some((result) => result.blocked) ?? false;
        }
      })
      .catch(() => {
        if (requestIdRef.current === requestId) {
          prefetchBlockedRef.current = false; // fail-open on error
        }
      });
  }, [checkCompliance, isComplianceEnabled]);

  const gate = useCallback(
    async <ResultValue>(
      action: () => ResultValue | Promise<ResultValue>,
    ): Promise<ResultValue | undefined> => {
      if (!isComplianceEnabled) {
        return await action();
      }

      // Await the in-flight prefetch if the user acted before it settled; if it
      // already resolved this is effectively instant. We deliberately do NOT
      // re-check here: core's ComplianceController performs no request dedup, so
      // every check is a real network call, and in the extension that call also
      // crosses the UI -> background (MV3) boundary (and can wake an evicted
      // service worker). Trusting the prefetch — mobile's contract — is the
      // cheapest correct behavior; we fail open if the prefetch rejected.
      await prefetchRef.current;

      if (prefetchBlockedRef.current) {
        showAccessRestrictedModal();
        return undefined;
      }

      return await action();
    },
    [isComplianceEnabled, showAccessRestrictedModal],
  );

  return useMemo(
    () => ({ isComplianceEnabled, isBlocked, checkCompliance, gate }),
    [isComplianceEnabled, isBlocked, checkCompliance, gate],
  );
}
