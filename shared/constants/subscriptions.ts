import { SUBSCRIPTION_STATUSES } from '@metamask/subscription-controller';

export const ActiveSubscriptionStatuses: string[] = [
  SUBSCRIPTION_STATUSES.active,
  SUBSCRIPTION_STATUSES.trialing,
  SUBSCRIPTION_STATUSES.provisional,
];

export const PausedSubscriptionStatuses: string[] = [
  SUBSCRIPTION_STATUSES.paused,
  SUBSCRIPTION_STATUSES.pastDue,
  SUBSCRIPTION_STATUSES.unpaid,
];

export const SUBSCRIPTION_DEFAULT_TRIAL_PERIOD_DAYS = 14;

export const SUBSCRIPTION_DEFAULT_PAYMENT_TOKEN = 'mUSD';
