import { Messenger } from '@metamask/base-controller';
import {
  DeFiPositionsControllerMessenger,
  DeFiPositionsController,
} from '@metamask/assets-controllers';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  DeFiPositionsControllerInitMessenger,
  getDeFiPositionsControllerInitMessenger,
  getDeFiPositionsControllerMessenger,
} from '../messengers/defi-positions/defi-positions-controller-messenger';
import { DeFiPositionsControllerInit } from './defi-positions-controller-init';

jest.mock('@metamask/assets-controllers');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    DeFiPositionsControllerMessenger,
    DeFiPositionsControllerInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getDeFiPositionsControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getDeFiPositionsControllerInitMessenger(
      baseControllerMessenger,
    ),
  };
}

describe('DefiPositionsControllerInit', () => {
  const defiPositionsControllerClassMock = jest.mocked(DeFiPositionsController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(DeFiPositionsControllerInit(requestMock).controller).toBeInstanceOf(
      DeFiPositionsController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    DeFiPositionsControllerInit(requestMock);

    expect(defiPositionsControllerClassMock).toHaveBeenCalled();
  });
});
