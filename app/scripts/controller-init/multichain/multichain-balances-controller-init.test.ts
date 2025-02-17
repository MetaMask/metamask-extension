import { MultichainBalancesController } from '@metamask/assets-controllers';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getMultichainBalancesControllerMessenger,
  MultichainBalancesControllerMessenger,
} from '../messengers/multichain';
import { MultichainBalancesControllerInit } from './multichain-balances-controller-init';

jest.mock('@metamask/assets-controllers');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<MultichainBalancesControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainBalancesControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('MultichainBalancesControllerInit', () => {
  const multichainBalancesControllerClassMock = jest.mocked(
    MultichainBalancesController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      MultichainBalancesControllerInit(requestMock).controller,
    ).toBeInstanceOf(MultichainBalancesController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    MultichainBalancesControllerInit(requestMock);

    expect(multichainBalancesControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.MultichainBalancesController,
    });
  });
});
