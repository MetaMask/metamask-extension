import { PRODUCT_TYPES, Subscription } from '@metamask/subscription-controller';
import {
  ActiveSubscriptionStatuses,
  PausedSubscriptionStatuses,
} from '../constants/subscriptions';
import { getIsMetaMaskShieldFeatureEnabled } from '../modules/environment';
import { DAY } from '../constants/time';

const SUBSCRIPTION_ENDING_SOON_DAYS = DAY;

function getShieldSubscription(
  subscriptions: Subscription | Subscription[],
): Subscription | undefined {
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
  return shieldSubscription;
}

export function getIsShieldSubscriptionActive(
  subscriptions: Subscription | Subscription[],
): boolean {
  // check the feature flag first
  if (!getIsMetaMaskShieldFeatureEnabled()) {
    return false;
  }

  const shieldSubscription = getShieldSubscription(subscriptions);

  if (!shieldSubscription) {
    return false;
  }

  return ActiveSubscriptionStatuses.includes(shieldSubscription.status);
}

export function getIsShieldSubscriptionPaused(
  subscriptions: Subscription | Subscription[],
): boolean {
  // check the feature flag first
  if (!getIsMetaMaskShieldFeatureEnabled()) {
    return false;
  }

  const shieldSubscription = getShieldSubscription(subscriptions);

  if (!shieldSubscription) {
    return false;
  }

  return PausedSubscriptionStatuses.includes(shieldSubscription.status);
}

export function getIsShieldSubscriptionEndingSoon(
  subscriptions: Subscription | Subscription[],
): boolean {
  // show subscription ending soon for crypto payment only with endDate (next billing cycle) for user to send new approve transaction
  const shieldSubscription = getShieldSubscription(subscriptions);

  if (!shieldSubscription) {
    return false;
  }

  if (!shieldSubscription?.endDate) {
    return false;
  }

  return (
    new Date(shieldSubscription.endDate).getTime() - Date.now() <
    SUBSCRIPTION_ENDING_SOON_DAYS
  );
}
