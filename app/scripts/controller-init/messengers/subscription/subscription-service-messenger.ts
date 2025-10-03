import { Messenger } from '@metamask/base-controller';
import type {
  SubscriptionControllerActions,
  SubscriptionControllerEvents,
} from '@metamask/subscription-controller';
import {
  SERVICE_NAME,
  SubscriptionServiceMessenger,
} from '../../../services/subscription/types';

/**
 * Get a restricted messenger for the SubscriptionService. This is scoped to the
 * actions and events that the SubscriptionService is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSubscriptionServiceMessenger(
  messenger: Messenger<
    SubscriptionControllerActions,
    SubscriptionControllerEvents
  >,
): SubscriptionServiceMessenger {
  return messenger.getRestricted({
    name: SERVICE_NAME,
    allowedActions: [
      'SubscriptionController:getPricing',
      'SubscriptionController:getSubscriptions',
      'SubscriptionController:startShieldSubscriptionWithCard',
      'SubscriptionController:updatePaymentMethod',
      'SubscriptionController:getCryptoApproveTransactionParams',
      'SubscriptionController:getBillingPortalUrl',
    ],
    allowedEvents: [],
  });
}
