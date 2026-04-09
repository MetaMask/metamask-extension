import {
  TransactionPayController,
  TransactionPayControllerMessenger,
} from '@metamask/transaction-pay-controller';
import { getRootMessenger } from '../lib/messenger';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getTransactionPayControllerMessenger,
  getTransactionPayControllerInitMessenger,
  TransactionPayControllerInitMessenger,
} from './messengers';
import { TransactionPayControllerInit } from './transaction-pay-controller-init';

jest.mock('@metamask/transaction-pay-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    TransactionPayControllerMessenger,
    TransactionPayControllerInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getTransactionPayControllerMessenger(baseMessenger),
    initMessenger: getTransactionPayControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('TransactionPayControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = TransactionPayControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(TransactionPayController);
  });

  it('passes the proper arguments to the controller', () => {
    TransactionPayControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(TransactionPayController);
    expect(controllerMock).toHaveBeenCalledWith({
      getDelegationTransaction: expect.any(Function),
      getStrategy: expect.any(Function),
      messenger: expect.any(Object),
      state: undefined,
    });
  });
});
