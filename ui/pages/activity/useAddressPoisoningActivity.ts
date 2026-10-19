import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { checkAddressPoisoning } from '../../store/actions';
import { getCompleteAddressBook } from '../../selectors/selectors';
import { selectTransactions } from '../../selectors/transactionController';
import type { ActivityRowProps } from './types';

export function getFromAddress(activity: ActivityRowProps['data']) {
  if (activity.type !== 'receive' || activity.status === 'pending') {
    return undefined;
  }

  return activity.data.from;
}

function selectKnownRecipientsVersion(state: Parameters<typeof selectTransactions>[0]) {
  const transactions = selectTransactions(state);
  const addressBook = getCompleteAddressBook(state);
  return `${transactions.length}\0${addressBook.length}`;
}

export function useAddressPoisoningActivity(
  activity: ActivityRowProps['data'],
) {
  const normalizedFrom = getFromAddress(activity)?.toLowerCase();
  const knownRecipientsVersion = useSelector(selectKnownRecipientsVersion);

  const { data, isPending, isFetching } = useQuery({
    queryKey: [
      'activityAddressPoisoning',
      normalizedFrom,
      knownRecipientsVersion,
    ],
    enabled: Boolean(normalizedFrom),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (!normalizedFrom) {
        return [];
      }
      const matches = await checkAddressPoisoning(normalizedFrom);
      return Array.isArray(matches) ? matches : [];
    },
  });

  const isPoisoningSuspect = Boolean(normalizedFrom && data && data.length > 0);
  const pending = Boolean(
    normalizedFrom && (isPending || (isFetching && data === undefined)),
  );

  return isPoisoningSuspect && !pending;
}
