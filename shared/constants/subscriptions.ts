import { SUBSCRIPTION_STATUSES } from '@metamask/subscription-controller';

export const ActiveSubscriptionStatuses: string[] = [
  SUBSCRIPTION_STATUSES.active,
  SUBSCRIPTION_STATUSES.trialing,
  SUBSCRIPTION_STATUSES.provisional,
];

/**
 * The minimum fiat (USD) balance threshold for the shield entry modal to be shown
 */
export const SHIELD_MIN_FIAT_BALANCE_THRESHOLD = 1000;
