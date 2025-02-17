import { MultiChainAssetsRatesController } from '@metamask/assets-controllers';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getMultiChainAssetsRatesControllerMessenger,
  MultiChainAssetsRatesControllerMessenger,
} from '../messengers/multichain';
import { MultiChainAssetsRatesControllerInit } from './multichain-rates-assets-controller-init';

jest.mock('@metamask/assets-controllers');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<MultiChainAssetsRatesControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultiChainAssetsRatesControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('MultiChainAssetsRatesControllerInit', () => {
  const multiChainAssetsRatesControllerClassMock = jest.mocked(
    MultiChainAssetsRatesController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      MultiChainAssetsRatesControllerInit(requestMock).controller,
    ).toBeInstanceOf(MultiChainAssetsRatesController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    MultiChainAssetsRatesControllerInit(requestMock);

    expect(multiChainAssetsRatesControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.MultiChainAssetsRatesController,
    });
  });
});
