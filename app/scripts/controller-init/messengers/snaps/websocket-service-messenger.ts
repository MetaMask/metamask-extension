import { Messenger } from '@metamask/messenger';
import {
  WebSocketServiceEvents,
  WebSocketServiceAllowedActions,
} from '@metamask/snaps-controllers';
import { RootMessenger } from '../../../lib/messenger';

export type WebSocketServiceMessenger = ReturnType<
  typeof getWebSocketServiceMessenger
>;

/**
 * Get a restricted messenger for the WebSocket service. This is scoped to the
 * actions and events that the WebSocket service is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getWebSocketServiceMessenger(
  messenger: RootMessenger<
    WebSocketServiceAllowedActions,
    WebSocketServiceEvents
  >,
) {
  const serviceMessenger = new Messenger<
    'WebSocketService',
    WebSocketServiceAllowedActions,
    WebSocketServiceEvents,
    typeof messenger
  >({
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
