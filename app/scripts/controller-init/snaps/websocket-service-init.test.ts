import { WebSocketService } from '@metamask/snaps-controllers';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  CronjobControllerMessenger,
  getWebSocketServiceMessenger,
} from '../messengers/snaps';
import { getRootMessenger } from '../../lib/messenger';
import { WebSocketServiceInit } from './websocket-service-init';

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<CronjobControllerMessenger>
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
    const { controller } = WebSocketServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(WebSocketService);
  });
});
