import { AccountActivityServiceMessenger } from '@metamask/core-backend';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../../lib/messenger';

type Actions = MessengerActions<AccountActivityServiceMessenger>;

type Events = MessengerEvents<AccountActivityServiceMessenger>;

/**
 * Get a restricted messenger for the Account Activity service. This is scoped to the
 * actions and events that the Account Activity service is allowed to handle.
 *
 * @param messenger - The main controller messenger.
 * @returns The restricted messenger.
 */
export function getAccountActivityServiceMessenger(
  messenger: RootMessenger<Actions, Events>,
): AccountActivityServiceMessenger {
  const serviceMessenger = new Messenger<
    'AccountActivityService',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'AccountActivityService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
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
    events: [
      'AccountsController:selectedAccountChange',
      'BackendWebSocketService:connectionStateChanged',
    ],
  });
  return serviceMessenger;
}
