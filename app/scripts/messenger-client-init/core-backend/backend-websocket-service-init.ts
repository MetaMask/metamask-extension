import { BackendWebSocketService } from '@metamask/core-backend';
import { Json } from '@metamask/utils';
import { MessengerClientInitFunction } from '../types';
import {
  BackendWebSocketServiceMessenger,
  BackendWebSocketServiceInitMessenger,
} from '../messengers/core-backend';
import { trace } from '../../../../shared/lib/trace';
import { getManifestFlags } from '../../../../shared/lib/manifestFlags';

/**
 * Resolve a raw feature flag value to a boolean. The value is a boolean when
 * resolved from the remote config, or a `{ value }` object when provided by a
 * flag override or test mock. Handle both so `{ value: false }` is not misread
 * as truthy.
 *
 * @param flag - The raw feature flag value.
 * @returns Whether the flag is enabled.
 */
function resolveFlag(flag: Json | undefined): boolean {
  if (typeof flag === 'object' && flag !== null && 'value' in flag) {
    return Boolean(flag.value);
  }

  return typeof flag === 'boolean' ? flag : false;
}

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
export const BackendWebSocketServiceInit: MessengerClientInitFunction<
  BackendWebSocketService,
  BackendWebSocketServiceMessenger,
  BackendWebSocketServiceInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const messengerClient = new BackendWebSocketService({
    messenger: controllerMessenger,
    url:
      process.env.MM_BACKEND_WEBSOCKET_URL ||
      'wss://gateway.api.cx.metamask.io/v1',
    // Inject the Sentry-backed trace function from extension platform
    // @ts-expect-error: Types of `TraceRequest` are not the same.
    traceFn: trace,
    // Feature flag AND app lifecycle integration
    // Service will check this callback before connecting/reconnecting
    isEnabled: () => {
      try {
        // Client manifest flag
        const manifestFlag =
          getManifestFlags().remoteFeatureFlags?.backendWebSocketConnection;

        // Remote feature flag
        const remoteFlag = initMessenger?.call(
          'RemoteFeatureFlagController:getState',
        )?.remoteFeatureFlags?.backendWebSocketConnection;

        return resolveFlag(manifestFlag ?? remoteFlag);
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
    messengerClient,
  };
};
