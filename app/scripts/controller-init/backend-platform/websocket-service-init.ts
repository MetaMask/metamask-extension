import { WebSocketService } from '@metamask/backend-platform';
import { ControllerInitFunction } from '../types';
import { WebSocketServiceMessenger } from '../messengers/backend-platform';

/**
 * Initialize the WebSocket service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const WebSocketServiceInit: ControllerInitFunction<
  WebSocketService,
  WebSocketServiceMessenger
> = ({ controllerMessenger }) => {
  const controller = new WebSocketService({
    messenger: controllerMessenger,
    url: process.env.BACKEND_WEBSOCKET_URL || 'ws://127.0.0.1:1234',
    timeout: 10000,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
    requestTimeout: 30000,
    policy: {
      maxFailures: 5,
      failureThreshold: 60000,
      resetTimeout: 300000,
    },
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};