import { Messenger } from '@metamask/base-controller';
import { MultichainRouter } from '@metamask/snaps-controllers';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getMultichainRouterMessenger,
  MultichainRouterMessenger,
} from '../messengers/multichain';
import {
  getMultichainRouterInitMessenger,
  MultichainRouterInitMessenger,
} from '../messengers/multichain/multichain-router-messenger';
import { MultichainRouterInit } from './multichain-router-init';

jest.mock('@metamask/snaps-controllers');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    MultichainRouterMessenger,
    MultichainRouterInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainRouterMessenger(baseControllerMessenger),
    initMessenger: getMultichainRouterInitMessenger(baseControllerMessenger),
  };
}

describe('MultichainRouterInit', () => {
  const multichainRouterClassMock = jest.mocked(MultichainRouter);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(MultichainRouterInit(requestMock).controller).toBeInstanceOf(
      MultichainRouter,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    MultichainRouterInit(requestMock);

    expect(multichainRouterClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      withSnapKeyring: expect.any(Function),
    });
  });
});
