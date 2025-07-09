import { MultichainAccountController } from '@metamask/multichain-account-controller';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getMultichainAccountControllerMessenger,
  MultichainAccountControllerMessenger,
} from '../messengers/accounts';
import { MultichainAccountControllerInit } from './multichain-account-controller-init';

jest.mock('@metamask/multichain-account-controller');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<MultichainAccountControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainAccountControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('MultichainAccountControllerInit', () => {
  const accountTreeControllerClassMock = jest.mocked(MultichainAccountController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(MultichainAccountControllerInit(requestMock).controller).toBeInstanceOf(
      MultichainAccountController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    MultichainAccountControllerInit(requestMock);

    expect(accountTreeControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.MultichainAccountController,
    });
  });
});
