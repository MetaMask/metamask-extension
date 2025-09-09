import {
  AccountActivityServiceMessenger as BackendPlatformAccountActivityServiceMessenger,
} from '@metamask/backend-platform';

export type AccountActivityServiceMessenger = BackendPlatformAccountActivityServiceMessenger;

/**
 * Get a restricted messenger for the Account Activity service. This is scoped to the
 * actions and events that the Account Activity service is allowed to handle.
 *
 * @param messenger - The main controller messenger.
 * @returns The restricted messenger.
 */
export function getAccountActivityServiceMessenger(
  messenger: any, // Using any to avoid type conflicts with the main messenger
): AccountActivityServiceMessenger {
  return messenger.getRestricted({
    name: 'AccountActivityService',
    allowedActions: [
      // Actions this service can call on other controllers
      'AccountsController:getAccountByAddress',
      'AccountsController:getSelectedAccount',
      'TokenBalancesController:updateChainPollingConfigs',
      'TokenBalancesController:getDefaultPollingInterval',
      // Actions this service provides/registers
      'AccountActivityService:subscribeAccounts',
      'AccountActivityService:unsubscribeAccounts',
    ],
    allowedEvents: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:selectedAccountChange',
      'BackendWebSocketService:connectionStateChanged',
      // Events this service can publish
      'AccountActivityService:accountSubscribed',
      'AccountActivityService:accountUnsubscribed',
      'AccountActivityService:transactionUpdated',
      'AccountActivityService:balanceUpdated',
      'AccountActivityService:subscriptionError',
    ],
  });
}
