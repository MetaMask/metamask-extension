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
  });

  // Check feature flag before connecting
  try {
    let isWebSocketEnabled: boolean;

    // Check for local environment variable override first (for development)
    const envOverride = process.env.BACKEND_WEBSOCKET_CONNECTION_ENABLED as string | boolean | null;
    if (envOverride !== null) {
      isWebSocketEnabled = envOverride === true || envOverride === 'true';
      console.log(`[BackendWebSocketService] Using environment variable override: ${isWebSocketEnabled}`);
    } else {
      // Fall back to remote feature flag
      const remoteFeatureFlagState = initMessenger?.call('RemoteFeatureFlagController:getState');
      isWebSocketEnabled = Boolean(
        remoteFeatureFlagState?.remoteFeatureFlags?.backendWebSocketConnectionEnabled
      );
      console.log(`[BackendWebSocketService] Using remote feature flag: ${isWebSocketEnabled}`);
    }

    if (isWebSocketEnabled) {
      // Connect to WebSocket if feature flag is enabled
      controller.connect().catch((error) => {
        console.warn('[BackendWebSocketService] Failed to connect during initialization:', error);
        // Don't throw here - let the service handle reconnection logic
      });
    } else {
      console.log('[BackendWebSocketService] Connection disabled by feature flag');
    }
  } catch (error) {
    // If feature flag check fails, default to connecting for backward compatibility
    console.warn('[BackendWebSocketService] Could not check feature flag, defaulting to connect:', error);
    controller.connect().catch((connectionError) => {
      console.warn('[BackendWebSocketService] Failed to connect during initialization:', connectionError);
    });
  }

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
