import {
  CachedLastSelectedPaymentMethod,
  PricingResponse,
  PRODUCT_TYPES,
  ProductType,
  Subscription,
  SubscriptionControllerState,
} from '@metamask/subscription-controller';
import {
  getIsShieldSubscriptionActive,
  getShieldSubscription,
} from '../../../shared/lib/shield';
import { ShieldSubscriptionError } from '../../../shared/modules/shield';

export type SubscriptionState = {
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

export function getUserSubscriptions(state: SubscriptionState): {
  customerId?: string;
  subscriptions: Subscription[];
  trialedProducts: ProductType[];
  lastSubscription?: Subscription;
} {
  return {
    customerId: state.metamask.customerId,
    subscriptions: state.metamask.subscriptions,
    trialedProducts: state.metamask.trialedProducts,
    lastSubscription: state.metamask.lastSubscription,
  };
}

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
