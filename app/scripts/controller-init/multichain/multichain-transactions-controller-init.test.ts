import { Messenger } from '@metamask/base-controller';
import { MultichainTransactionsController } from '@metamask/multichain-transactions-controller';

import type { MultichainTransactionsControllerMessenger } from '../messengers/multichain';
import { getMultichainTransactionsControllerMessenger } from '../messengers/multichain';
import { buildControllerInitRequestMock } from '../test/utils';
import type { ControllerInitRequest } from '../types';
import { MultichainTransactionsControllerInit } from './multichain-transactions-controller-init';

jest.mock('@metamask/multichain-transactions-controller');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<MultichainTransactionsControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainTransactionsControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('MultichainTransactionsControllerInit', () => {
  const multichainTransactionsControllerClassMock = jest.mocked(
    MultichainTransactionsController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      MultichainTransactionsControllerInit(requestMock).controller,
    ).toBeInstanceOf(MultichainTransactionsController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    MultichainTransactionsControllerInit(requestMock);

    expect(multichainTransactionsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.MultichainTransactionsController,
    });
  });
});
