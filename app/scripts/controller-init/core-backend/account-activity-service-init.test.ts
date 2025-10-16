import {
  AccountActivityService,
  AccountActivityServiceMessenger,
} from '@metamask/core-backend';
import { Messenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { getAccountActivityServiceMessenger } from '../messengers/core-backend';
import { AccountActivityServiceInit } from './account-activity-service-init';

jest.mock('@metamask/core-backend');
jest.mock('../../../../shared/lib/trace');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<AccountActivityServiceMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAccountActivityServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('AccountActivityServiceInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { controller } = AccountActivityServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(AccountActivityService);
  });

  it('passes the messenger and traceFn to the controller', () => {
    AccountActivityServiceInit(getInitRequestMock());

    const controllerMock = jest.mocked(AccountActivityService);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      traceFn: expect.any(Function),
    });
  });

  it('returns null for both state keys', () => {
    const result = AccountActivityServiceInit(getInitRequestMock());

    expect(result.memStateKey).toBeNull();
    expect(result.persistedStateKey).toBeNull();
  });

  it('returns the controller instance', () => {
    const { controller } = AccountActivityServiceInit(getInitRequestMock());

    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(AccountActivityService);
  });
});
