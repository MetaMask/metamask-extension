import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { WebSocketServiceMessenger } from '@metamask/snaps-controllers';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the WebSocket service. This is scoped to the
 * actions and events that the WebSocket service is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getWebSocketServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<WebSocketServiceMessenger>,
    MessengerEvents<WebSocketServiceMessenger>
  >,
) {
  const serviceMessenger: WebSocketServiceMessenger = new Messenger({
    namespace: 'WebSocketService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: ['SnapController:handleRequest'],
    events: [
      'SnapController:snapUpdated',
      'SnapController:snapUninstalled',
      'SnapController:snapInstalled',
    ],
  });
  return serviceMessenger;
}
