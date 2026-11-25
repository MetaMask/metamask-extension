import {
  CachedLastSelectedPaymentMethod,
  PricingResponse,
  MoneyAccountFeature,
  PRODUCT_TYPES,
  selectHasEntitlement,
  selectIsActiveSubscriber,
  SUBSCRIPTION_STATUSES,
  type ProductType,
  Subscription,
  type SubscriptionStatus,
  SubscriptionControllerState,
} from '@metamask/subscription-controller';
import { createSelector } from 'reselect';
import {
  getIsShieldSubscriptionActive,
  getShieldSubscription,
  ShieldSubscriptionError,
} from '../../../shared/lib/shield';

type SubscriptionState = {
  metamask: SubscriptionControllerState & {
    showShieldEntryModalOnce: boolean | null;
    shieldSubscriptionError?: ShieldSubscriptionError | null;
  };
};

export function getSubscriptionPricing(
  state: SubscriptionState,
): PricingResponse | undefined {
  return state.metamask.pricing;
}

export const getUserSubscriptions = createSelector(
  [
    (state: SubscriptionState) => state.metamask.customerId,
    (state: SubscriptionState) => state.metamask.subscriptions,
    (state: SubscriptionState) => state.metamask.trialedProducts,
    (state: SubscriptionState) => state.metamask.lastSubscription,
  ],
  (customerId, subscriptions, trialedProducts, lastSubscription) => ({
    customerId,
    subscriptions,
    trialedProducts,
    lastSubscription,
  }),
);

const hasProduct = (subscription: Subscription, product: ProductType) =>
  subscription.products.some(({ name }) => name === product);

export const getSubscriptionByProduct = (
  state: SubscriptionState,
  product: ProductType,
) =>
  state.metamask.subscriptions?.find((subscription) =>
    hasProduct(subscription, product),
  );

export const getLastSubscriptionByProduct = (
  state: SubscriptionState,
  product: ProductType,
) => {
  const { lastSubscription } = state.metamask;
  return lastSubscription && hasProduct(lastSubscription, product)
    ? lastSubscription
    : undefined;
};

export function getLastShieldSubscription(
  state: SubscriptionState,
): Subscription | undefined {
  return getLastSubscriptionByProduct(state, PRODUCT_TYPES.SHIELD);
}

export const getLastSelectedPaymentMethodByProduct = (
  state: SubscriptionState,
  product: ProductType,
) => state.metamask.lastSelectedPaymentMethod?.[product];

export const getIsMoneyAccountPlusSubscriber = (state: SubscriptionState) =>
  selectIsActiveSubscriber(state.metamask, PRODUCT_TYPES.MONEY_ACCOUNT_PLUS);

const MONEY_ACCOUNT_PLUS_HUB_STATUSES = new Set<SubscriptionStatus>([
  SUBSCRIPTION_STATUSES.active,
  SUBSCRIPTION_STATUSES.trialing,
  SUBSCRIPTION_STATUSES.provisional,
  SUBSCRIPTION_STATUSES.paused,
  SUBSCRIPTION_STATUSES.unpaid,
  SUBSCRIPTION_STATUSES.pastDue,
  SUBSCRIPTION_STATUSES.awaitingFunds,
]);

/**
 * Finds the current subscription the Money Plus hub can render.
 *
 * @param subscriptions - The stored or freshly fetched subscriptions.
 * @returns The matching current subscription, if any.
 */
export function findMoneyAccountPlusHubSubscription(
  subscriptions?: Subscription[],
): Subscription | undefined {
  return subscriptions?.find(
    (subscription) =>
      MONEY_ACCOUNT_PLUS_HUB_STATUSES.has(subscription.status) &&
      hasProduct(subscription, PRODUCT_TYPES.MONEY_ACCOUNT_PLUS),
  );
}

/**
 * Selects the current subscription the Money Plus hub can render.
 *
 * @param state - The Redux state.
 * @returns The matching current subscription, if any.
 */
export function getMoneyAccountPlusHubSubscription(
  state: SubscriptionState,
): Subscription | undefined {
  return findMoneyAccountPlusHubSubscription(state.metamask.subscriptions);
}

/**
 * Checks for a stored Money Plus subscription the hub can render.
 *
 * @param state - The Redux state.
 * @returns Whether a matching current subscription exists.
 */
export function getHasMoneyAccountPlusHubMembership(
  state: SubscriptionState,
): boolean {
  return Boolean(getMoneyAccountPlusHubSubscription(state));
}

export const getHasAnyMoneyAccountPlusEntitlement = (
  state: SubscriptionState,
) =>
  Object.values(MoneyAccountFeature).some((feature) =>
    selectHasEntitlement(
      state.metamask,
      PRODUCT_TYPES.MONEY_ACCOUNT_PLUS,
      feature,
    ),
  );

export const getHasMoneyAccountPremiumApyEntitlement = (
  state: SubscriptionState,
) =>
  selectHasEntitlement(
    state.metamask,
    PRODUCT_TYPES.MONEY_ACCOUNT_PLUS,
    MoneyAccountFeature.PremiumApy,
  );

export const getSubscriptionBenefits = (state: SubscriptionState) =>
  state.metamask.benefits;

export function getIsActiveShieldSubscription(
  state: SubscriptionState,
): boolean {
  return getIsShieldSubscriptionActive(state.metamask.subscriptions);
}

export function getHasShieldEntryModalShownOnce(
  state: SubscriptionState,
): boolean {
  const showShieldEntryModalOnce = state.metamask?.showShieldEntryModalOnce;
  return Boolean(
    showShieldEntryModalOnce !== null && showShieldEntryModalOnce !== undefined,
  );
}

export function getLastUsedShieldSubscriptionPaymentDetails(
  state: SubscriptionState,
): CachedLastSelectedPaymentMethod | undefined {
  return state.metamask.lastSelectedPaymentMethod?.[PRODUCT_TYPES.SHIELD];
}

export function getHasSubscribedToShield(state: SubscriptionState): boolean {
  const currentShieldSubscription = getShieldSubscription(
    state.metamask.subscriptions,
  );
  const lastShieldSubscription =
    state.metamask.lastSubscription &&
    getShieldSubscription(state.metamask.lastSubscription);
  const hasSubscribedToShield =
    Boolean(currentShieldSubscription) || Boolean(lastShieldSubscription);
  return hasSubscribedToShield;
}

export function getLatestShieldSubscription(
  state: SubscriptionState,
): Subscription | undefined {
  const { subscriptions, lastSubscription } = state.metamask;
  const currentShieldSubscription = getShieldSubscription(subscriptions);
  if (lastSubscription && !currentShieldSubscription) {
    return getShieldSubscription(lastSubscription);
  }
  return currentShieldSubscription;
}

/**
 * Returns the shield subscription error object if one is set, or null otherwise.
 * Used to display subscription-related errors on the shield plan page.
 *
 * @param state - Redux state object.
 * @returns The error object with message and optional code, or null if no error
 */
export function getShieldSubscriptionError(
  state: SubscriptionState,
): ShieldSubscriptionError | null {
  return state.metamask.shieldSubscriptionError ?? null;
}
