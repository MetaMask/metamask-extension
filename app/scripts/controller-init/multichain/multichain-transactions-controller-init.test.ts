import { MultichainTransactionsController } from '@metamask/multichain-transactions-controller';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getMultichainTransactionsControllerInitMessenger,
  getMultichainTransactionsControllerMessenger,
  MultichainTransactionsControllerInitMessenger,
} from '../messengers/multichain-transactions-controller-messenger';
import { MultichainTransactionsControllerInit } from './multichain-transactions-controller-init';

type MultichainTransactionsControllerMessenger = ConstructorParameters<
  typeof MultichainTransactionsController
>[0]['messenger'];

jest.mock('@metamask/multichain-transactions-controller');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    MultichainTransactionsControllerMessenger,
    MultichainTransactionsControllerInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainTransactionsControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getMultichainTransactionsControllerInitMessenger(
      baseControllerMessenger,
    ),
  };
}

describe('MultichainTransactions Controller Init', () => {
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
