import { MultichainAssetsRatesController } from '@metamask/assets-controllers';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getMultichainAssetsRatesControllerMessenger,
  MultichainAssetsRatesControllerMessenger,
} from '../messengers/multichain';
import { MultichainAssetsRatesControllerInit } from './multichain-rates-assets-controller-init';

jest.mock('@metamask/assets-controllers');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<MultichainAssetsRatesControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainAssetsRatesControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('MultichainAssetsRatesControllerInit', () => {
  const multichainAssetsRatesControllerClassMock = jest.mocked(
    MultichainAssetsRatesController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      MultichainAssetsRatesControllerInit(requestMock).controller,
    ).toBeInstanceOf(MultichainAssetsRatesController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    MultichainAssetsRatesControllerInit(requestMock);

    expect(multichainAssetsRatesControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.MultichainAssetsRatesController,
    });
  });
});
