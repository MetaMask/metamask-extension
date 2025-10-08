import { Subscription } from '@metamask/subscription-controller';
import {
  ActiveSubscriptionStatuses,
  SubscriptionProductName,
} from '../constants/subscriptions';
import { getIsMetaMaskShieldFeatureEnabled } from '../modules/environment';

export function getIsShieldSubscriptionActive(
  subscriptions: Subscription[],
): boolean {
  // check the feature flag first
  if (!getIsMetaMaskShieldFeatureEnabled()) {
    return false;
  }

  const shieldSubscription = subscriptions.find((subscription) =>
    subscription.products.some(
      (product) => product.name === SubscriptionProductName.SHIELD,
    ),
  );

  if (!shieldSubscription) {
    return false;
  }

  return ActiveSubscriptionStatuses.includes(shieldSubscription.status);
}
