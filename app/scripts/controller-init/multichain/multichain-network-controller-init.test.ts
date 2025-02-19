import { MultichainNetworkController } from '@metamask/multichain-network-controller';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  MultichainNetworkControllerMessenger,
  getMultichainNetworkControllerMessenger,
} from '../messengers/multichain';
import { MultichainNetworkControllerInit } from './multichain-network-controller-init';

jest.mock('@metamask/multichain-network-controller');

const buildInitRequestMock = (): jest.Mocked<
  ControllerInitRequest<MultichainNetworkControllerMessenger>
> => {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainNetworkControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
};

describe('MultichainNetworkControllerInit', () => {
  const multichainNetworkControllerClassMock = jest.mocked(
    MultichainNetworkController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      MultichainNetworkControllerInit(requestMock).controller,
    ).toBeInstanceOf(MultichainNetworkController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    MultichainNetworkControllerInit(requestMock);

    expect(multichainNetworkControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.MultichainNetworkController,
    });
  });
});
