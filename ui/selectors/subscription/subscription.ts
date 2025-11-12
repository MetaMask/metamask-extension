import {
  CachedLastSelectedPaymentMethod,
  PricingResponse,
  PRODUCT_TYPES,
  ProductType,
  Subscription,
  SubscriptionControllerState,
  SubscriptionEligibility,
} from '@metamask/subscription-controller';
import {
  getIsShieldSubscriptionActive,
  getShieldSubscription,
} from '../../../shared/lib/shield';

/**
 * Temporary: SubscriptionEligibility with modalType.
 * Waiting to be updated in the API and SubscriptionEligibility type.
 */
export const MODAL_TYPE = {
  A: 'A',
  B: 'B',
} as const;
export type ModalType = (typeof MODAL_TYPE)[keyof typeof MODAL_TYPE];
export type SubscriptionEligibilityWithModalType = SubscriptionEligibility & {
  modalType?: ModalType;
};

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
  return Boolean(state.metamask.showShieldEntryModalOnce !== null);
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
