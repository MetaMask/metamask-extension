import { SUBSCRIPTION_STATUSES } from '@metamask/subscription-controller';

export const ActiveSubscriptionStatuses: string[] = [
  SUBSCRIPTION_STATUSES.active,
  SUBSCRIPTION_STATUSES.trialing,
  SUBSCRIPTION_STATUSES.provisional,
];
