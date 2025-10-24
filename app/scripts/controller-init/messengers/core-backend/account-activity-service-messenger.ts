import { AccountActivityServiceMessenger } from '@metamask/core-backend';
import { BaseControllerMessenger } from '../../types';

/**
 * Get a restricted messenger for the Account Activity service. This is scoped to the
 * actions and events that the Account Activity service is allowed to handle.
 *
 * @param messenger - The main controller messenger.
 * @returns The restricted messenger.
 */
export function getAccountActivityServiceMessenger(
  messenger: BaseControllerMessenger,
): AccountActivityServiceMessenger {
  return messenger.getRestricted({
    name: 'AccountActivityService',
    allowedActions: [
      'AccountsController:getSelectedAccount',
      'BackendWebSocketService:connect',
      'BackendWebSocketService:forceReconnection',
      'BackendWebSocketService:subscribe',
      'BackendWebSocketService:getConnectionInfo',
      'BackendWebSocketService:channelHasSubscription',
      'BackendWebSocketService:getSubscriptionsByChannel',
      'BackendWebSocketService:findSubscriptionsByChannelPrefix',
      'BackendWebSocketService:addChannelCallback',
      'BackendWebSocketService:removeChannelCallback',
    ],
    allowedEvents: [
      'AccountsController:selectedAccountChange',
      'BackendWebSocketService:connectionStateChanged',
    ],
  });
}
