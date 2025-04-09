import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import { DeFiPositionsControllerMessenger } from '@metamask/assets-controllers';
import { DeFiPositionsController } from '@metamask/assets-controllers';
import { DeFiPositionsControllerInit } from './defi-positions-controller-init';
import { getDeFiPositionsControllerMessenger } from '../messengers/defi-positions/defi-positions-controller-messenger';

jest.mock('@metamask/assets-controllers');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<DeFiPositionsControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getDeFiPositionsControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
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
