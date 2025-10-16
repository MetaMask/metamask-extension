import { BackendWebSocketService } from '@metamask/core-backend';
import { ControllerInitFunction } from '../types';
import {
  BackendWebSocketServiceMessenger,
  BackendWebSocketServiceInitMessenger,
} from '../messengers/core-backend';
import { trace } from '../../../../shared/lib/trace';

/**
 * Initialize the Backend Platform WebSocket service with authentication support.
 * This provides WebSocket connectivity for backend platform services
 * like AccountActivityService and other platform-level integrations.
 *
 * Authentication Flow (simplified with AuthenticationController):
 * 1. Core WebSocketService: Controls WHETHER connections are allowed (AuthenticationController.isSignedIn = yes)
 * 2. Browser/Extension lifecycle: Controls WHEN to connect/disconnect (close = disconnect, open = connect)
 * 3. AuthenticationController.isSignedIn includes BOTH wallet unlock + identity provider authentication
 * 4. Fresh bearer tokens retrieved on each connection attempt (getBearerToken checks wallet unlock internally)
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @param request.initMessenger - The messenger for accessing other controllers.
 * @returns The initialized service.
 */
export const BackendWebSocketServiceInit: ControllerInitFunction<
  BackendWebSocketService,
  BackendWebSocketServiceMessenger,
  BackendWebSocketServiceInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const controller = new BackendWebSocketService({
    messenger: controllerMessenger,
    url:
      process.env.MM_BACKEND_WEBSOCKET_URL ||
      'wss://gateway.api.cx.metamask.io/v1',
    // Backend Platform optimized configuration
    timeout: 15000, // Longer timeout for backend operations
    reconnectDelay: 1000, // Conservative reconnect strategy
    maxReconnectDelay: 30000, // Allow longer delays for backend stability
    requestTimeout: 20000, // Reasonable timeout for backend requests
    // Inject the Sentry-backed trace function from extension platform
    // @ts-expect-error: Types of `TraceRequest` are not the same.
    traceFn: trace,
    // Feature flag AND app lifecycle integration
    // Service will check this callback before connecting/reconnecting
    isEnabled: () => {
      try {
        const remoteFeatureFlagState = initMessenger?.call(
          'RemoteFeatureFlagController:getState',
        );
        const { backendWebSocketConnection } =
          remoteFeatureFlagState?.remoteFeatureFlags || {};

        const result =
          backendWebSocketConnection &&
          typeof backendWebSocketConnection === 'object' &&
          'value' in backendWebSocketConnection &&
          Boolean(backendWebSocketConnection.value);

        return Boolean(result);
      } catch (error) {
        // If feature flag check fails, default to NOT connecting for safer startup
        console.warn(
          '[BackendWebSocketService] Could not check feature flag, defaulting to NOT connect:',
          error,
        );
        return false;
      }
    },
  });

  // Authentication and lock/unlock handling is now managed by the core WebSocket service
  // Core service will automatically connect when wallet is unlocked (no manual connect() needed)

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
