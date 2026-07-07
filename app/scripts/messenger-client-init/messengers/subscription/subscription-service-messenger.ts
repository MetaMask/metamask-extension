import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import {
  SERVICE_NAME,
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
    MessengerActions<SubscriptionServiceMessenger>,
    MessengerEvents<SubscriptionServiceMessenger>
  >,
): SubscriptionServiceMessenger {
  const serviceMessenger: SubscriptionServiceMessenger = new Messenger({
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
      'SubscriptionController:getState',
      'SubscriptionController:submitShieldSubscriptionCryptoApproval',
      'SubscriptionController:linkRewards',
      'SubscriptionController:clearLastSelectedPaymentMethod',
      'AppStateController:getState',
      'AppStateController:setPendingShieldCohort',
      'AppStateController:setPendingRedirectRoute',
      'AppStateController:setShieldSubscriptionError',
      'AuthenticationController:getBearerToken',
      'TransactionController:getTransactions',
      'AccountsController:getState',
      'PreferencesController:getState',
      'SmartTransactionsController:getState',
      'NetworkController:getState',
      'RemoteFeatureFlagController:getState',
      'MetaMetricsController:trackEvent',
      'KeyringController:getState',
      // Rewards Integration
      'RewardsController:getSeasonStatus',
      'RewardsController:getSeasonMetadata',
      'RewardsController:getHasAccountOptedIn',
    ],
  });
  return serviceMessenger;
}
