import { BackendWebSocketServiceMessenger as BackendPlatformWebSocketServiceMessenger } from '@metamask/core-backend';

export type BackendWebSocketServiceMessenger =
  BackendPlatformWebSocketServiceMessenger;

/**
 * Get a restricted messenger for the Backend Platform WebSocket service.
 * This is scoped to backend platform operations and services.
 *
 * @param messenger - The main controller messenger.
 * @returns The restricted messenger.
 */
export function getBackendWebSocketServiceMessenger(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messenger: any, // Using any to avoid type conflicts with the main messenger
): BackendPlatformWebSocketServiceMessenger {
  return messenger.getRestricted({
    name: 'BackendWebSocketService',
    allowedActions: [
      'AuthenticationController:getBearerToken', // Get auth token (includes wallet unlock check)
    ],
    allowedEvents: [
      'AuthenticationController:stateChange', // Listen for authentication state (sign in/out)
      'KeyringController:lock', // Listen for wallet lock
      'KeyringController:unlock', // Listen for wallet unlock
    ],
  });
}

export type BackendWebSocketServiceInitMessenger = ReturnType<
  typeof getBackendWebSocketServiceInitMessenger
>;

export function getBackendWebSocketServiceInitMessenger(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
