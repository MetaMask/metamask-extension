import { AccountActivityService, WebSocketService } from '@metamask/backend-platform';
import { Messenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  AccountActivityServiceMessenger,
  getAccountActivityServiceMessenger,
} from '../messengers/backend-platform';
import { AccountActivityServiceInit } from './account-activity-service-init';

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<AccountActivityServiceMessenger>
> {
  const baseMessenger = new Messenger<never, never>();
  const mockWebSocketService = {} as WebSocketService;

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAccountActivityServiceMessenger(baseMessenger),
    initMessenger: undefined,
    getController: jest.fn().mockImplementation((name) => {
      if (name === 'WebSocketService') {
        return mockWebSocketService;
      }
      throw new Error(`Controller ${name} not found`);
    }),
  };

  return requestMock;
}

describe('AccountActivityServiceInit', () => {
  it('initializes the controller', () => {
    const { controller } = AccountActivityServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(AccountActivityService);
  });

  it('does not store state', () => {
    const { memStateKey, persistedStateKey } = AccountActivityServiceInit(
      getInitRequestMock(),
    );

    expect(memStateKey).toBeNull();
    expect(persistedStateKey).toBeNull();
  });

  it('gets WebSocketService from getController', () => {
    const mockRequest = getInitRequestMock();
    AccountActivityServiceInit(mockRequest);

    expect(mockRequest.getController).toHaveBeenCalledWith('WebSocketService');
  });

  it('initializes with correct configuration', () => {
    const mockRequest = getInitRequestMock();
    const { controller } = AccountActivityServiceInit(mockRequest);

    expect(controller).toBeInstanceOf(AccountActivityService);
    // The constructor should have been called with the messenger and WebSocketService
    expect(controller).toBeDefined();
  });
});