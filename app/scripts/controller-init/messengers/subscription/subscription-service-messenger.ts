import { Messenger } from '@metamask/messenger';
import type { SubscriptionControllerEvents } from '@metamask/subscription-controller';
import {
  SERVICE_NAME,
  SubscriptionServiceAction,
  SubscriptionServiceMessenger,
} from '../../../services/subscription/types';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the SubscriptionService. This is scoped to the
 * actions and events that the SubscriptionService is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSubscriptionServiceMessenger(
  messenger: RootMessenger<
    SubscriptionServiceAction,
    SubscriptionControllerEvents
  >,
): SubscriptionServiceMessenger {
  const serviceMessenger = new Messenger<
    'SubscriptionService',
    SubscriptionServiceAction,
    SubscriptionControllerEvents,
    typeof messenger
  >({
    namespace: SERVICE_NAME,
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'SubscriptionController:getPricing',
      'SubscriptionController:getSubscriptions',
      'SubscriptionController:startShieldSubscriptionWithCard',
      'SubscriptionController:updatePaymentMethod',
      'SubscriptionController:getCryptoApproveTransactionParams',
      'SubscriptionController:getBillingPortalUrl',
      'SubscriptionController:submitSponsorshipIntents',
      'AuthenticationController:getBearerToken',
      'TransactionController:getTransactions',
      'AccountsController:getState',
      'PreferencesController:getState',
      'SmartTransactionsController:getState',
      'NetworkController:getState',
      'SwapsController:getState',
    ],
  });
  return serviceMessenger;
}
