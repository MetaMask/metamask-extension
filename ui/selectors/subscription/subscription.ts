import {
  PricingResponse,
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

export function getUserSubscriptions(state: BackupState): Subscription[] {
  return state.metamask.subscriptions;
}
