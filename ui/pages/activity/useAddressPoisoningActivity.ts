import { useAddressPoisoningDetection } from '../confirmations/hooks/send/useAddressPoisoningDetection';
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
  const { isPoisoningSuspect, pending } =
    useAddressPoisoningDetection(fromAddress);

  return Boolean(fromAddress) && isPoisoningSuspect && !pending;
}
