import {
  WebSocketServiceMessenger as BackendPlatformWebSocketServiceMessenger,
} from '@metamask/backend-platform';

export type BackendWebSocketServiceMessenger = BackendPlatformWebSocketServiceMessenger;

/**
 * Get a restricted messenger for the Backend Platform WebSocket service.
 * This is scoped to backend platform operations and services.
 *
 * @param messenger - The main controller messenger.
 * @returns The restricted messenger.
 */
export function getBackendWebSocketServiceMessenger(
  messenger: any, // Using any to avoid type conflicts with the main messenger
): BackendWebSocketServiceMessenger {
  return messenger.getRestricted({
    name: 'BackendWebSocketService',
    allowedActions: [
      // Actions this WebSocket service registers/provides
      'BackendWebSocketService:init',
      'BackendWebSocketService:connect',
      'BackendWebSocketService:disconnect',
      'BackendWebSocketService:sendMessage',
      'BackendWebSocketService:sendRequest',
      'BackendWebSocketService:getConnectionInfo',
      'BackendWebSocketService:getSubscriptionByChannel',
      'BackendWebSocketService:isChannelSubscribed',
    ],
    allowedEvents: [
      'BackendWebSocketService:connectionStateChanged',
      'BackendWebSocketService:messageReceived',
      'BackendWebSocketService:subscriptionUpdated',
      'BackendWebSocketService:subscriptionError',
      'BackendWebSocketService:connectionError',
    ],
  });
}
