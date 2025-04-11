import { MultichainAssetsController } from '@metamask/assets-controllers';
import { Messenger } from '@metamask/base-controller';

import type { MultichainAssetsControllerMessenger } from '../messengers/multichain';
import { getMultichainAssetsControllerMessenger } from '../messengers/multichain';
import { buildControllerInitRequestMock } from '../test/utils';
import type { ControllerInitRequest } from '../types';
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
