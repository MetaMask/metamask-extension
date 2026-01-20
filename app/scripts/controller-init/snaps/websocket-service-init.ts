import { WebSocketService } from '@metamask/snaps-controllers';
import { ControllerInitFunction } from '../types';
import { WebSocketServiceMessenger } from '../messengers/snaps';

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
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
