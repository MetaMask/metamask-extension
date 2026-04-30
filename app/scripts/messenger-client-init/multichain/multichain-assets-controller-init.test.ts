import {
  MultichainAssetsController,
  MultichainAssetsControllerMessenger,
} from '@metamask/assets-controllers';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import { getMultichainAssetsControllerMessenger } from '../messengers/multichain';
import { getRootMessenger } from '../../lib/messenger';
import { MultichainAssetsControllerInit } from './multichain-assets-controller-init';

jest.mock('@metamask/assets-controllers');

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<MultichainAssetsControllerMessenger>
> {
  const baseControllerMessenger = getRootMessenger();

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
      MultichainAssetsControllerInit(requestMock).messengerClient,
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
