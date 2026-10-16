import { OHLCVServiceMessenger } from '@metamask/core-backend';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the OHLCV service. This is scoped to the
 * actions and events that the OHLCV service is allowed to handle.
 *
 * @param messenger - The main controller messenger.
 * @returns The restricted messenger.
 */
export function getOHLCVServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<OHLCVServiceMessenger>,
    MessengerEvents<OHLCVServiceMessenger>
  >,
): OHLCVServiceMessenger {
  const serviceMessenger: OHLCVServiceMessenger = new Messenger({
    namespace: 'OHLCVService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
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
    events: ['BackendWebSocketService:connectionStateChanged'],
  });
  return serviceMessenger;
}
