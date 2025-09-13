import {
  PricingResponse,
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
