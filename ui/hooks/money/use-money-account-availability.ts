import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import { isMoneyAccountEnabled } from '../../../shared/lib/money/feature-flags';
import { getUseExternalServices } from '../../selectors';
import {
  clearReportedMoneyQueryError,
  reportMoneyQueryErrorOnce,
} from '../../helpers/money/report-money-error';
import { submitRequestToBackground } from '../../store/background-connection';
import { MoneyAccountAvailabilityServiceQueryKeys } from './query-keys';

export type MoneyAccountAvailability =
  | { isAvailable: true; address: Hex }
  | { isAvailable: false };

const unavailable: MoneyAccountAvailability = { isAvailable: false };

/**
 * Resolves whether the Money Account surface is available and returns its
 * SRP-derived address when it is.
 *
 * Gated on basic functionality (`useExternalServices`) as well as the remote
 * flag, so a user with the toggle off costs no geolocation fetch and no seed
 * access.
 *
 * @returns The Money Account availability query and normalized availability.
 */
export function useMoneyAccountAvailability() {
  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);
  const isEnabled =
    isMoneyAccountEnabled(remoteFeatureFlags) &&
    Boolean(isBasicFunctionalityEnabled);

  const query = useQuery({
    queryKey: [
      MoneyAccountAvailabilityServiceQueryKeys.GetAvailability,
      isEnabled,
    ],
    queryFn: () =>
      submitRequestToBackground<MoneyAccountAvailability>('messengerCall', [
        MoneyAccountAvailabilityServiceQueryKeys.GetAvailability,
        [],
      ]),
    enabled: isEnabled,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (!query.isError) {
      clearReportedMoneyQueryError('getAvailability');
      return;
    }
    reportMoneyQueryErrorOnce(
      'getAvailability',
      '[Money Account] Availability query failed',
      query.error,
      { query: 'getAvailability' },
    );
  }, [query.error, query.isError]);

  return {
    ...query,
    availability: isEnabled ? (query.data ?? unavailable) : unavailable,
  };
}
