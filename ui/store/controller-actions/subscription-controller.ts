import type { ProductType } from '@metamask/subscription-controller';
import { submitRequestToBackground } from '../background-connection';

/**
 * Checks whether the current user is eligible for a trial of the given product.
 *
 * @param product - The subscription product to check.
 * @returns Whether the user is eligible for the trial.
 */
export function getIsEligibleForSubscriptionTrial(
  product: ProductType,
): Promise<boolean> {
  return submitRequestToBackground(
    'SubscriptionController:isUserEligibleForTrial',
    [product],
  );
}
