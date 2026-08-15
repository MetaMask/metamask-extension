import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import {
  SERVICE_NAME,
  ShieldSubscriptionServiceMessenger,
} from '../../../services/subscription/types';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the ShieldSubscriptionService. This is scoped
 * to the actions and events that the ShieldSubscriptionService is allowed to
 * handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getShieldSubscriptionServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<ShieldSubscriptionServiceMessenger>,
    MessengerEvents<ShieldSubscriptionServiceMessenger>
  >,
): ShieldSubscriptionServiceMessenger {
  const serviceMessenger: ShieldSubscriptionServiceMessenger = new Messenger({
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
      'KeyringController:getState',
      // Rewards Integration
      'RewardsController:getSeasonStatus',
      'RewardsController:getSeasonMetadata',
      'RewardsController:getHasAccountOptedIn',
    ],
  });
  return serviceMessenger;
}
