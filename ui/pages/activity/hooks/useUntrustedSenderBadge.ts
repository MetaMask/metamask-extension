import { useSelector } from 'react-redux';
import { selectKnownAddresses } from '#ui/selectors/known-addresses';
import type { ActivityRowProps } from '../types';

export function isUntrustedSender(
  activity: ActivityRowProps['data'],
  knownAddresses: ReadonlySet<string>,
) {
  if (activity.type !== 'receive' || activity.status === 'pending') {
    return false;
  }

  const fromAddress = activity.data.from;
  if (!fromAddress) {
    return false;
  }

  return !knownAddresses.has(fromAddress.toLowerCase());
}

export function useUntrustedSenderBadge(activity: ActivityRowProps['data']) {
  const knownAddresses = useSelector(selectKnownAddresses);

  return isUntrustedSender(activity, knownAddresses);
}
