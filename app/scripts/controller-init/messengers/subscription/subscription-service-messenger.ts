import { Messenger } from '@metamask/base-controller';
import type { SubscriptionControllerEvents } from '@metamask/subscription-controller';
import {
  SERVICE_NAME,
  SubscriptionServiceAction,
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
  messenger: Messenger<SubscriptionServiceAction, SubscriptionControllerEvents>,
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
      'AuthenticationController:getBearerToken',
    ],
    allowedEvents: [],
  });
}
