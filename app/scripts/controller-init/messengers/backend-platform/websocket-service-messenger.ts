import { Messenger } from '@metamask/base-controller';
import type {
  WebSocketServiceActions,
  WebSocketServiceEvents,
} from '@metamask/backend-platform';

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
  messenger: Messenger<WebSocketServiceActions, WebSocketServiceEvents>,
) {
  return messenger.getRestricted({
    name: 'WebSocketService',
    allowedActions: [],
    allowedEvents: [],
  });
}