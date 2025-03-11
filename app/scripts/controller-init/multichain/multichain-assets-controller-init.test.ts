import { MultichainAssetsController } from '@metamask/assets-controllers';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getMultichainAssetsControllerMessenger,
  MultichainAssetsControllerMessenger,
} from '../messengers/multichain';
import { MultichainAssetsControllerInit } from './multichain-assets-controller-init';

jest.mock('@metamask/assets-controllers');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<MultichainAssetsControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainAssetsControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('MultichainAssetsControllerInit', () => {
  const MultichainAssetsControllerClassMock = jest.mocked(
    MultichainAssetsController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      MultichainAssetsControllerInit(requestMock).controller,
    ).toBeInstanceOf(MultichainAssetsController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    MultichainAssetsControllerInit(requestMock);

    expect(MultichainAssetsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.MultichainAssetsController,
    });
  });
});
