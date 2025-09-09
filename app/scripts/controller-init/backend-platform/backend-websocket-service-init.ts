import { WebSocketService } from '@metamask/backend-platform';
import { ControllerInitFunction } from '../types';
import { BackendWebSocketServiceMessenger } from '../messengers/backend-platform';

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
  BackendWebSocketServiceMessenger
> = ({ controllerMessenger }) => {
  const controller = new WebSocketService({
    messenger: controllerMessenger,
    url: process.env.METAMASK_BACKEND_WEBSOCKET_URL || 'wss://api.metamask.io/backend/ws',
    // Backend Platform optimized configuration
    timeout: 15000, // Longer timeout for backend operations
    reconnectDelay: 1000, // Conservative reconnect strategy
    maxReconnectDelay: 30000, // Allow longer delays for backend stability
    requestTimeout: 20000, // Reasonable timeout for backend requests
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
