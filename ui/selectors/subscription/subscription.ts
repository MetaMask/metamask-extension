import {
  CachedLastSelectedPaymentMethod,
  PricingResponse,
  ProductType,
  Subscription,
  SubscriptionControllerState,
} from '@metamask/subscription-controller';
import { getIsShieldSubscriptionActive } from '../../../shared/lib/shield';

export type SubscriptionState = {
  metamask: SubscriptionControllerState & {
    showShieldEntryModalOnce: boolean | null;
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
} {
  return {
    customerId: state.metamask.customerId,
    subscriptions: state.metamask.subscriptions,
    trialedProducts: state.metamask.trialedProducts,
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
  return Boolean(state.metamask.showShieldEntryModalOnce !== null);
}

export function getLastSelectedSubscriptionPaymentMethod(
  state: SubscriptionState,
  product: ProductType,
): CachedLastSelectedPaymentMethod | undefined {
  return state.metamask.lastSelectedPaymentMethod?.[product];
}
