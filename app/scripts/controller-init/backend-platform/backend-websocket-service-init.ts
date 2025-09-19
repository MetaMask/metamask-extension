import { WebSocketService } from '@metamask/backend-platform';
import { ControllerInitFunction } from '../types';
import {
  BackendWebSocketServiceMessenger,
  BackendWebSocketServiceInitMessenger,
} from '../messengers/backend-platform';

/**
 * Initialize the Backend Platform WebSocket service.
 * This provides WebSocket connectivity for backend platform services
 * like AccountActivityService and other platform-level integrations.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const BackendWebSocketServiceInit: ControllerInitFunction<
  WebSocketService,
  BackendWebSocketServiceMessenger,
  BackendWebSocketServiceInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const controller = new WebSocketService({
    messenger: controllerMessenger,
    url: process.env.METAMASK_BACKEND_WEBSOCKET_URL || 'wss://api.metamask.io/backend/ws',
    // Backend Platform optimized configuration
    timeout: 15000, // Longer timeout for backend operations
    reconnectDelay: 1000, // Conservative reconnect strategy
    maxReconnectDelay: 30000, // Allow longer delays for backend stability
    requestTimeout: 20000, // Reasonable timeout for backend requests
    // Feature flag integration - service will check this callback before connecting/reconnecting
    enabledCallback: () => {
      try {
        // Check for local environment variable override first (for development)
        const envOverride = process.env.BACKEND_WEBSOCKET_CONNECTION_ENABLED as string | boolean | null;
        if (envOverride !== null) {
          return envOverride === true || envOverride === 'true';
        }

        // Fall back to remote feature flag
        const remoteFeatureFlagState = initMessenger?.call('RemoteFeatureFlagController:getState');
        return Boolean(
          remoteFeatureFlagState?.remoteFeatureFlags?.backendWebSocketConnectionEnabled
        );
      } catch (error) {
        // If feature flag check fails, default to NOT connecting for safer startup
        console.warn('[BackendWebSocketService] Could not check feature flag, defaulting to NOT connect:', error);
        return false;
      }
    },
  });

  // Start connection attempt (service will check enabledCallback internally)
  controller.connect().catch((error) => {
    console.warn('[BackendWebSocketService] Failed to connect during initialization:', error);
    // Don't throw here - let the service handle reconnection logic
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
