import { useSelector } from 'react-redux';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import {
  normalizeKnownAddress,
  selectKnownAddresses,
} from '../../../selectors/known-addresses';

export function isUntrustedSender(
  item: ActivityListItem,
  knownAddresses: ReadonlySet<string>,
) {
  if (item.type !== 'receive' || item.status === 'pending') {
    return false;
  }

  const normalizedFrom = normalizeKnownAddress(item.data.from);
  if (!normalizedFrom) {
    return false;
  }

  return !knownAddresses.has(normalizedFrom);
}

export function useUntrustedSender(item: ActivityListItem) {
  const knownAddresses = useSelector(selectKnownAddresses);

  return isUntrustedSender(item, knownAddresses);
}
