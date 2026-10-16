import { useSelector } from 'react-redux';
import {
  normalizeKnownAddress,
  selectKnownAddresses,
} from '#ui/selectors/known-addresses';
import type { ActivityRowProps } from '../types';

export function isUntrustedSender(
  activity: ActivityRowProps['data'],
  knownAddresses: ReadonlySet<string>,
) {
  if (activity.type !== 'receive' || activity.status === 'pending') {
    return false;
  }

  const normalizedFrom = normalizeKnownAddress(activity.data.from);
  if (!normalizedFrom) {
    return false;
  }

  return !knownAddresses.has(normalizedFrom);
}

export function useUntrustedSenderBadge(activity: ActivityRowProps['data']) {
  const knownAddresses = useSelector(selectKnownAddresses);

  return isUntrustedSender(activity, knownAddresses);
}
