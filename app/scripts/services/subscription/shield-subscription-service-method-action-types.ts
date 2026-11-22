/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { ShieldSubscriptionService } from './shield-subscription-service';

export type ShieldSubscriptionServiceUpdateSubscriptionCardPaymentMethodAction =
  {
    type: `ShieldSubscriptionService:updateSubscriptionCardPaymentMethod`;
    handler: ShieldSubscriptionService['updateSubscriptionCardPaymentMethod'];
  };

export type ShieldSubscriptionServiceUpdateSubscriptionCryptoPaymentMethodAction =
  {
    type: `ShieldSubscriptionService:updateSubscriptionCryptoPaymentMethod`;
    handler: ShieldSubscriptionService['updateSubscriptionCryptoPaymentMethod'];
  };

export type ShieldSubscriptionServiceStartSubscriptionWithCardAction = {
  type: `ShieldSubscriptionService:startSubscriptionWithCard`;
  handler: ShieldSubscriptionService['startSubscriptionWithCard'];
};

/**
 * Handles the shield subscription approval transaction after confirm
 *
 * @param txMeta - The transaction metadata.
 * @returns Promise<void> - resolves when the transaction is submitted successfully.
 */
export type ShieldSubscriptionServiceHandlePostTransactionAction = {
  type: `ShieldSubscriptionService:handlePostTransaction`;
  handler: ShieldSubscriptionService['handlePostTransaction'];
};

export type ShieldSubscriptionServiceSubmitSubscriptionSponsorshipIntentAction =
  {
    type: `ShieldSubscriptionService:submitSubscriptionSponsorshipIntent`;
    handler: ShieldSubscriptionService['submitSubscriptionSponsorshipIntent'];
  };

/**
 * Link the reward to the existing shield subscription.
 *
 * @param subscriptionId - Shield subscription ID to link the reward to.
 * @param rewardPoints - The reward points.
 * @returns Promise<void> - The reward subscription ID or undefined if the season is not active or the primary account is not opted in to rewards.
 */
export type ShieldSubscriptionServiceLinkRewardToExistingSubscriptionAction = {
  type: `ShieldSubscriptionService:linkRewardToExistingSubscription`;
  handler: ShieldSubscriptionService['linkRewardToExistingSubscription'];
};

/**
 * Union of all ShieldSubscriptionService action types.
 */
export type ShieldSubscriptionServiceMethodActions =
  | ShieldSubscriptionServiceUpdateSubscriptionCardPaymentMethodAction
  | ShieldSubscriptionServiceUpdateSubscriptionCryptoPaymentMethodAction
  | ShieldSubscriptionServiceStartSubscriptionWithCardAction
  | ShieldSubscriptionServiceHandlePostTransactionAction
  | ShieldSubscriptionServiceSubmitSubscriptionSponsorshipIntentAction
  | ShieldSubscriptionServiceLinkRewardToExistingSubscriptionAction;
