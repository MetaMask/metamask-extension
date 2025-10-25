import { Messenger } from '@metamask/base-controller';
import { UserOperationController } from '@metamask/user-operation-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getUserOperationControllerMessenger,
  UserOperationControllerMessenger,
} from '../messengers';
import { UserOperationControllerInit } from './user-operation-controller-init';

jest.mock('@metamask/user-operation-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<UserOperationControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getUserOperationControllerMessenger(baseMessenger),
    initMessenger: undefined,
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
    expect(controller).toBeInstanceOf(UserOperationController);
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
});
