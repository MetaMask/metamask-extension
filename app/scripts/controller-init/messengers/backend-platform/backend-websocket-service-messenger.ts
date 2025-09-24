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
): BackendPlatformWebSocketServiceMessenger {
  return messenger.getRestricted({
    name: 'BackendWebSocketService',
    allowedActions: [
      'AuthenticationController:getBearerToken', // Get auth token (includes wallet unlock check)
    ],
    allowedEvents: [
      'AuthenticationController:stateChange', // Listen for authentication state (includes wallet lock/unlock)
    ],
  });
}

export type BackendWebSocketServiceInitMessenger = ReturnType<
  typeof getBackendWebSocketServiceInitMessenger
>;

export function getBackendWebSocketServiceInitMessenger(
  messenger: any,
) {
  return messenger.getRestricted({
    name: 'BackendWebSocketServiceInit',
    allowedEvents: [],
    allowedActions: [
      'RemoteFeatureFlagController:getState',
      'AuthenticationController:getBearerToken',
    ],
  });
}
