import { UserOperationController } from '@metamask/user-operation-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getUserOperationControllerMessenger,
  getUserOperationControllerInitMessenger,
  UserOperationControllerMessenger,
  UserOperationControllerInitMessenger,
} from '../messengers';
import { getRootMessenger } from '../../lib/messenger';
import { UserOperationControllerInit } from './user-operation-controller-init';

jest.mock('@metamask/user-operation-controller', () => ({
  UserOperationController: jest.fn().mockImplementation(() => ({
    hub: {
      on: jest.fn(),
    },
  })),
}));

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    UserOperationControllerMessenger,
    UserOperationControllerInitMessenger
  >
> {
  const baseMessenger = getRootMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getUserOperationControllerMessenger(baseMessenger),
    initMessenger: getUserOperationControllerInitMessenger(baseMessenger),
  };

  // @ts-expect-error: Partial mock.
  requestMock.getController.mockImplementation((name: string) => {
    if (name === 'GasFeeController') {
      return {
        fetchGasFeeEstimates: jest.fn(),
      };
    }
    return undefined;
  });

  return requestMock;
}

describe('UserOperationControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = UserOperationControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(Object);
  });

  it('passes the proper arguments to the controller', () => {
    UserOperationControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(UserOperationController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      entrypoint: process.env.EIP_4337_ENTRYPOINT,
      getGasFeeEstimates: expect.any(Function),
    });
  });

  it('calls TransactionController:emulateNewTransaction when a new user operation is added', () => {
    const controllerMock = jest.mocked(UserOperationController);
    const onSpy = jest.fn();
    // @ts-expect-error Partial mock
    controllerMock.mockImplementation(() => {
      return {
        hub: {
          on: onSpy,
        },
      };
    });
    const initRequest = getInitRequestMock();
    const initMessengerCallSpy = jest
      .spyOn(initRequest.initMessenger, 'call')
      .mockImplementation(jest.fn());

    UserOperationControllerInit(initRequest);
    const onUserOperationAdded = onSpy.mock.calls.find(
      (call) => call[0] === 'user-operation-added',
    )[1];
    onUserOperationAdded({ id: 'mock-id' });

    expect(initMessengerCallSpy).toHaveBeenCalledWith(
      'TransactionController:emulateNewTransaction',
      'mock-id',
    );
  });

  it('calls TransactionController:emulateTransactionUpdate when a transaction is updated', () => {
    const controllerMock = jest.mocked(UserOperationController);
    const onSpy = jest.fn();
    // @ts-expect-error Partial mock
    controllerMock.mockImplementation(() => {
      return {
        hub: {
          on: onSpy,
        },
      };
    });
    const initRequest = getInitRequestMock();
    const initMessengerCallSpy = jest
      .spyOn(initRequest.initMessenger, 'call')
      .mockImplementation(jest.fn());

    UserOperationControllerInit(initRequest);
    const onTransactionUpdated = onSpy.mock.calls.find(
      (call) => call[0] === 'transaction-updated',
    )[1];
    onTransactionUpdated({ id: 'mock-id' });

    expect(initMessengerCallSpy).toHaveBeenCalledWith(
      'TransactionController:emulateTransactionUpdate',
      { id: 'mock-id' },
    );
  });
});
