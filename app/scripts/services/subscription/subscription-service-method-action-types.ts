/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { SubscriptionService } from './subscription-service';

export type SubscriptionServiceUpdateSubscriptionCardPaymentMethodAction = {
  type: `SubscriptionService:updateSubscriptionCardPaymentMethod`;
  handler: SubscriptionService['updateSubscriptionCardPaymentMethod'];
};

export type SubscriptionServiceUpdateSubscriptionCryptoPaymentMethodAction = {
  type: `SubscriptionService:updateSubscriptionCryptoPaymentMethod`;
  handler: SubscriptionService['updateSubscriptionCryptoPaymentMethod'];
};

export type SubscriptionServiceStartSubscriptionWithCardAction = {
  type: `SubscriptionService:startSubscriptionWithCard`;
  handler: SubscriptionService['startSubscriptionWithCard'];
};

/**
 * Handles the shield subscription approval transaction after confirm
 *
 * @param txMeta - The transaction metadata.
 * @returns Promise<void> - resolves when the transaction is submitted successfully.
 */
export type SubscriptionServiceHandlePostTransactionAction = {
  type: `SubscriptionService:handlePostTransaction`;
  handler: SubscriptionService['handlePostTransaction'];
};

export type SubscriptionServiceSubmitSubscriptionSponsorshipIntentAction = {
  type: `SubscriptionService:submitSubscriptionSponsorshipIntent`;
  handler: SubscriptionService['submitSubscriptionSponsorshipIntent'];
};

/**
 * Link the reward to the existing shield subscription.
 *
 * @param subscriptionId - Shield subscription ID to link the reward to.
 * @param rewardPoints - The reward points.
 * @returns Promise<void> - The reward subscription ID or undefined if the season is not active or the primary account is not opted in to rewards.
 */
export type SubscriptionServiceLinkRewardToExistingSubscriptionAction = {
  type: `SubscriptionService:linkRewardToExistingSubscription`;
  handler: SubscriptionService['linkRewardToExistingSubscription'];
};

/**
 * Union of all SubscriptionService action types.
 */
export type SubscriptionServiceMethodActions =
  | SubscriptionServiceUpdateSubscriptionCardPaymentMethodAction
  | SubscriptionServiceUpdateSubscriptionCryptoPaymentMethodAction
  | SubscriptionServiceStartSubscriptionWithCardAction
  | SubscriptionServiceHandlePostTransactionAction
  | SubscriptionServiceSubmitSubscriptionSponsorshipIntentAction
  | SubscriptionServiceLinkRewardToExistingSubscriptionAction;
