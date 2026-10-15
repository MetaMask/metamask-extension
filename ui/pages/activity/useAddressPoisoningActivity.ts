import { useQuery } from '@tanstack/react-query';
import { findSimilarAddresses } from '@metamask/phishing-controller';
import { useSelector } from 'react-redux';
import { selectAddressPoisoningKnownRecipients } from '../../selectors/address-poisoning-known-recipients';
import type { ActivityRowProps } from './types';

export function getFromAddress(activity: ActivityRowProps['data']) {
  if (activity.type !== 'receive' || activity.status === 'pending') {
    return undefined;
  }

  return activity.data.from;
}

export function useAddressPoisoningActivity(
  activity: ActivityRowProps['data'],
) {
  const fromAddress = getFromAddress(activity);
  const normalizedFrom = fromAddress?.toLowerCase();
  const { recipients, fingerprint } = useSelector(
    selectAddressPoisoningKnownRecipients,
  );

  const { data, isPending, isFetching } = useQuery({
    queryKey: ['activityAddressPoisoning', normalizedFrom, fingerprint],
    enabled: Boolean(normalizedFrom),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 10 * 60 * 1000,
    queryFn: () => {
      if (!normalizedFrom) {
        return [];
      }
      return findSimilarAddresses(normalizedFrom, [...recipients]);
    },
  });

  const isPoisoningSuspect = Boolean(normalizedFrom && data && data.length > 0);
  const pending = Boolean(
    normalizedFrom && (isPending || (isFetching && data === undefined)),
  );

  return isPoisoningSuspect && !pending;
}
