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

  const prefetchRef = useRef<Promise<
    WalletComplianceStatus[] | undefined
  > | null>(null);
  const latestSuccessfulBlockedRef = useRef(false);
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

  useEffect(() => {
    if (!isComplianceEnabled || addresses.length === 0) {
      requestIdRef.current += 1;
      latestSuccessfulBlockedRef.current = false;
      prefetchRef.current = null;
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    latestSuccessfulBlockedRef.current = false;
    const request = checkCompliance();
    prefetchRef.current = request;
    request
      .then((results) => {
        if (requestIdRef.current === requestId) {
          latestSuccessfulBlockedRef.current =
            results?.some((result) => result.blocked) ?? false;
        }
      })
      .catch(() => {
        if (requestIdRef.current === requestId) {
          latestSuccessfulBlockedRef.current = false;
        }
      });
  }, [addresses.length, checkCompliance, isComplianceEnabled]);

  const gate = useCallback(
    async <ResultValue>(
      action: () => ResultValue | Promise<ResultValue>,
    ): Promise<ResultValue | undefined> => {
      if (!isComplianceEnabled) {
        return await action();
      }

      let latestResults: WalletComplianceStatus[] | undefined;
      try {
        latestResults = prefetchRef.current
          ? await prefetchRef.current
          : await checkCompliance();
      } catch {
        latestSuccessfulBlockedRef.current = false;
      }

      const isLatestResultBlocked =
        latestResults?.some((result) => result.blocked) ?? false;

      if (latestSuccessfulBlockedRef.current || isLatestResultBlocked) {
        showAccessRestrictedModal();
        return undefined;
      }

      return await action();
    },
    [checkCompliance, isComplianceEnabled, showAccessRestrictedModal],
  );

  return useMemo(
    () => ({ isComplianceEnabled, isBlocked, checkCompliance, gate }),
    [isComplianceEnabled, isBlocked, checkCompliance, gate],
  );
}
