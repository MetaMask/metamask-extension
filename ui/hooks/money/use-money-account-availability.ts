import { useQuery } from '@tanstack/react-query';
import type { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import { isMoneyAccountEnabled } from '../../../shared/lib/money/feature-flags';
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
 * @returns The Money Account availability query and normalized availability.
 */
export function useMoneyAccountAvailability() {
  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);
  const isEnabled = isMoneyAccountEnabled(remoteFeatureFlags);

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

  return {
    ...query,
    availability: isEnabled ? (query.data ?? unavailable) : unavailable,
  };
}
