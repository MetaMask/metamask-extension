import {
  PricingResponse,
  ProductType,
  Subscription,
  SubscriptionControllerState,
} from '@metamask/subscription-controller';

export type BackupState = {
  metamask: SubscriptionControllerState;
};

export function getSubscriptionPricing(
  state: BackupState,
): PricingResponse | undefined {
  return state.metamask.pricing;
}

export function getUserSubscriptions(state: BackupState): {
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
