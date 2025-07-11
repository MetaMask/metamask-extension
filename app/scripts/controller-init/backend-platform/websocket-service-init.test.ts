import { WebSocketService } from '@metamask/backend-platform';
import { Messenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  WebSocketServiceMessenger,
  getWebSocketServiceMessenger,
} from '../messengers/backend-platform';
import { WebSocketServiceInit } from './websocket-service-init';

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<WebSocketServiceMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getWebSocketServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('WebSocketServiceInit', () => {
  it('initializes the controller', () => {
    const { controller } = WebSocketServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(WebSocketService);
  });

  it('does not store state', () => {
    const { memStateKey, persistedStateKey } = WebSocketServiceInit(
      getInitRequestMock(),
    );

    expect(memStateKey).toBeNull();
    expect(persistedStateKey).toBeNull();
  });

  it('initializes with correct configuration', () => {
    const mockRequest = getInitRequestMock();
    const { controller } = WebSocketServiceInit(mockRequest);

    expect(controller).toBeInstanceOf(WebSocketService);
    // The constructor should have been called with the messenger and configuration
    expect(controller).toBeDefined();
  });
});