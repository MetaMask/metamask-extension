import { PRODUCT_TYPES, Subscription } from '@metamask/subscription-controller';
import { ActiveSubscriptionStatuses } from '../constants/subscriptions';
import { getIsMetaMaskShieldFeatureEnabled } from '../modules/environment';

export function getIsShieldSubscriptionActive(
  subscriptions: Subscription | Subscription[],
): boolean {
  // check the feature flag first
  if (!getIsMetaMaskShieldFeatureEnabled()) {
    return false;
  }

  let shieldSubscription: Subscription | undefined;
  if (Array.isArray(subscriptions)) {
    shieldSubscription = subscriptions.find((subscription) =>
      subscription.products.some(
        (product) => product.name === PRODUCT_TYPES.SHIELD,
      ),
    );
  } else {
    const isShieldSubscription = subscriptions?.products?.some(
      (product) => product.name === PRODUCT_TYPES.SHIELD,
    );
    if (isShieldSubscription) {
      shieldSubscription = subscriptions;
    }
  }

  if (!shieldSubscription) {
    return false;
  }

  return ActiveSubscriptionStatuses.includes(shieldSubscription.status);
}
