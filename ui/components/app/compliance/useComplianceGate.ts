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

/**
 * Guards an async action behind an OFAC compliance check for the given address.
 *
 * On mount (and whenever `address` changes) the hook prefetches compliance
 * status in the background. When `gate(action)` is called it:
 *
 * - Skips the check entirely and runs the action when compliance is disabled.
 * - Awaits the in-flight prefetch for the current address (instant once it has
 * settled) rather than issuing a fresh check, since the underlying
 * ComplianceController performs no request dedup and the call crosses the UI ->
 * background (MV3) boundary. It fails open if the prefetch rejected.
 * - Abandons the action (returns `undefined`, shows nothing) if the selected
 * wallet changed while the check was in flight — the action belonged to the
 * previous wallet, so the user retries under the new one.
 * - Shows `AccessRestrictedModal` and returns `undefined` if any address is
 * blocked; otherwise runs the action and returns its result.
 *
 * @param address - A single wallet address or array of addresses to check.
 * @returns `{ isComplianceEnabled, isBlocked, checkCompliance, gate }`.
 * @example
 * const { gate } = useComplianceGate(recipientAddress);
 * const handleSend = useCallback(() => gate(async () => send()), [gate]);
 */
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

  // Holds the in-flight prefetch (tagged with the address set it belongs to) so
  // gate() can await it if the user acts before it resolves — and only when it
  // belongs to the currently selected address set.
  const prefetchRef = useRef<{
    addressKey: string;
    promise: Promise<unknown>;
  } | null>(null);

  // Stores the resolved blocked status from the most recent prefetch.
  // Default false = fail-open: assume not blocked until the API says otherwise.
  // Reset to false at the start of each prefetch (while in-flight) so gate()
  // never reads a stale result from a previous address.
  const prefetchBlockedRef = useRef<boolean>(false);

  // Guards against an in-flight prefetch for a previous address resolving late
  // and overwriting the result for the current address.
  const requestIdRef = useRef(0);

  // Latest-value refs, assigned during render so they reflect the currently
  // selected wallet the instant a switch re-renders — before the prefetch
  // effect runs. gate() reads these to detect a wallet switch that happens
  // while a compliance check is in flight.
  const currentAddressKeyRef = useRef(addressKey);
  currentAddressKeyRef.current = addressKey;

  const checkCompliance = useCallback(async () => {
    if (addresses.length === 0) {
      return undefined;
    }

    return await submitRequestToBackground<WalletComplianceStatus[]>(
      'complianceCheckWalletsCompliance',
      [addresses],
    );
  }, [addresses]);

  // gate() must call the current checkCompliance (bound to the current address
  // set), never a stale closure copy — its deps are intentionally minimal.
  const checkComplianceRef = useRef(checkCompliance);
  checkComplianceRef.current = checkCompliance;

  // Prefetch compliance status on mount and whenever the address changes.
  // `checkCompliance` is memoized on `addresses`, so its identity changes
  // exactly when the address set changes — that (not `addresses.length`, which
  // stays constant across an account switch) is the correct re-fetch signal.
  useEffect(() => {
    if (!isComplianceEnabled) {
      prefetchBlockedRef.current = false;
      prefetchRef.current = null;
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    prefetchBlockedRef.current = false; // reset while in-flight
    const promise = checkCompliance()
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
    prefetchRef.current = { addressKey, promise };
  }, [addressKey, checkCompliance, isComplianceEnabled]);

  const gate = useCallback(
    async <ResultValue>(
      action: () => ResultValue | Promise<ResultValue>,
    ): Promise<ResultValue | undefined> => {
      if (!isComplianceEnabled) {
        return await action();
      }

      const gateAddressKey = currentAddressKeyRef.current;
      const prefetch = prefetchRef.current;

      let blocked: boolean;
      if (prefetch && prefetch.addressKey === gateAddressKey) {
        // Common path: trust the prefetch for the current wallet. Await it in
        // case the user acted before it settled (instant if already resolved).
        // We deliberately do NOT re-check: core's ComplianceController performs
        // no request dedup, so every check is a real network call that also
        // crosses the UI -> background (MV3) boundary. Trusting the prefetch is
        // the cheapest correct behavior; it fails open if the prefetch rejected.
        await prefetch.promise;
        blocked = prefetchBlockedRef.current;
      } else {
        // No prefetch for the current wallet yet (transient window right after a
        // switch, before the effect runs). Do a one-off check for the current
        // wallet, failing open on error.
        let results: WalletComplianceStatus[] | undefined;
        try {
          results = await checkComplianceRef.current();
        } catch {
          results = undefined;
        }
        blocked = results?.some((result) => result.blocked) ?? false;
      }

      // If the selected wallet changed while the check was in flight, abandon:
      // the action was initiated under the previous wallet. Run nothing and show
      // nothing; the user can retry under the new wallet, which has its own check.
      if (currentAddressKeyRef.current !== gateAddressKey) {
        return undefined;
      }

      if (blocked) {
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
