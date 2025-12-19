import {
  PAYMENT_TYPES,
  PaymentType,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  RecurringInterval,
  Subscription,
  SUBSCRIPTION_STATUSES,
  SubscriptionCryptoPaymentMethod,
} from '@metamask/subscription-controller';
import {
  ActiveSubscriptionStatuses,
  PausedSubscriptionStatuses,
} from '../constants/subscriptions';
import { getIsMetaMaskShieldFeatureEnabled } from '../modules/environment';
import { DAY } from '../constants/time';

const SUBSCRIPTION_ENDING_SOON_DAYS = DAY;

export function getShieldSubscription(
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

export function getIsShieldSubscriptionTrialing(
  subscriptions: Subscription | Subscription[],
): boolean {
  const shieldSubscription = getShieldSubscription(subscriptions);
  return (
    shieldSubscription?.status === SUBSCRIPTION_STATUSES.trialing ||
    (shieldSubscription?.status === SUBSCRIPTION_STATUSES.provisional &&
      Boolean(shieldSubscription?.trialPeriodDays)) // subscription in provisional status and has trial info is considered trialing
  );
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

/**
 * Check if the subscription can change payment method from crypto to card.
 *
 * @param subscriptions
 * @returns
 */
export function getIsShieldSubscriptionCanChangePaymentMethodToCard(
  subscriptions: Subscription | Subscription[],
): boolean {
  // atm crypto to card change payment method only work if there is no stripe subscription yet, which means provisional -> (invalid payment method) -> paused
  const shieldSubscription = getShieldSubscription(subscriptions);
  return shieldSubscription?.status === SUBSCRIPTION_STATUSES.paused;
}

/**
 * Get the subscription payment data.
 *
 * @param subscription - The subscription.
 * @returns The subscription payment data. If subscription is not valid, return default payment data.
 */
export function getSubscriptionPaymentData(subscription?: Subscription): {
  paymentType: PaymentType;
  billingInterval: RecurringInterval;
  cryptoPaymentChain?: string;
  cryptoPaymentCurrency?: string;
} {
  const paymentType = subscription?.paymentMethod.type || PAYMENT_TYPES.byCard;
  const billingInterval = subscription?.interval || RECURRING_INTERVALS.year;
  let cryptoPaymentChain: string | undefined;
  let cryptoPaymentCurrency: string | undefined;
  if (paymentType === PAYMENT_TYPES.byCrypto) {
    const cryptoPaymentMethod =
      subscription?.paymentMethod as SubscriptionCryptoPaymentMethod;
    cryptoPaymentChain = cryptoPaymentMethod.crypto.chainId;
    cryptoPaymentCurrency = cryptoPaymentMethod.crypto.tokenSymbol;
  }

  return {
    paymentType,
    billingInterval,
    cryptoPaymentChain,
    cryptoPaymentCurrency,
  };
}

/**
 * Get the subscription duration in days.
 *
 * If the subscription is not active, return the number of days between the start date and the end date.
 *
 * @param subscription - The subscription.
 * @returns The subscription duration in days.
 */
export function getSubscriptionDurationInDays(
  subscription: Subscription,
): number {
  let subscriptionEndDate = new Date();
  if (subscription.endDate) {
    subscriptionEndDate = new Date(subscription.endDate);
  }
  const subscriptionStartDate = new Date(subscription.currentPeriodStart);

  const diff = subscriptionEndDate.getTime() - subscriptionStartDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
