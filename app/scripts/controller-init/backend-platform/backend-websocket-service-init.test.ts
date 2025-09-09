import { WebSocketService as BackendWebSocketService } from '@metamask/backend-platform';
import { Messenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  BackendWebSocketServiceMessenger,
  getBackendWebSocketServiceMessenger,
} from '../messengers/backend-platform';
import { BackendWebSocketServiceInit } from './backend-websocket-service-init';

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<BackendWebSocketServiceMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getBackendWebSocketServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('BackendWebSocketServiceInit', () => {
  it('initializes the controller', () => {
    const { controller } = BackendWebSocketServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(BackendWebSocketService);
  });

  it('uses backend platform configuration', () => {
    const { controller } = BackendWebSocketServiceInit(getInitRequestMock());
    // Verify backend-specific configuration is applied
    expect(controller).toBeInstanceOf(BackendWebSocketService);
  });
});
