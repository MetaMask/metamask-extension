import {
  WebSocketService,
  WebSocketServiceMessenger,
} from '@metamask/snaps-controllers';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { getRootMessenger } from '../../lib/messenger';
import { getWebSocketServiceMessenger } from '../messengers/snaps';
import { WebSocketServiceInit } from './websocket-service-init';

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<WebSocketServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getWebSocketServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('WebSocketServiceInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } = WebSocketServiceInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(WebSocketService);
  });
});
