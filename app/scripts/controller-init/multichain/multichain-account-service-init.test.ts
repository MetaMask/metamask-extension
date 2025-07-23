import { MultichainAccountService } from '@metamask/multichain-account-service';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getMultichainAccountServiceMessenger,
  MultichainAccountServiceMessenger,
} from '../messengers/accounts';
import { MultichainAccountServiceInit } from './multichain-account-service-init';

jest.mock('@metamask/multichain-account-service');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<MultichainAccountServiceMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainAccountServiceMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('MultichainAccountServiceInit', () => {
  const accountTreeControllerClassMock = jest.mocked(MultichainAccountService);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns service instance', () => {
    const requestMock = buildInitRequestMock();
    expect(MultichainAccountServiceInit(requestMock).controller).toBeInstanceOf(
      MultichainAccountService,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    MultichainAccountServiceInit(requestMock);

    expect(accountTreeControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
    });
  });
});
