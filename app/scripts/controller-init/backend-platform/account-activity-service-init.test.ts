import { AccountActivityService } from '@metamask/backend-platform';
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
  const mockWebSocketService = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
    isChannelSubscribed: jest.fn(),
    getSubscriptionByChannel: jest.fn(),
  };

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAccountActivityServiceMessenger(baseMessenger),
    initMessenger: undefined,
    getController: jest.fn().mockImplementation((name: string) => {
      if (name === 'BackendWebSocketService') {
        return mockWebSocketService;
      }
      throw new Error(`Controller not found: ${name}`);
    }),
  };

  return requestMock;
}

describe('AccountActivityServiceInit', () => {
  it('initializes the controller', () => {
    const { controller } = AccountActivityServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(AccountActivityService);
  });

  it('returns correct state keys', () => {
    const result = AccountActivityServiceInit(getInitRequestMock());

    expect(result.memStateKey).toBeNull();
    expect(result.persistedStateKey).toBe('AccountActivityService');
  });
});
