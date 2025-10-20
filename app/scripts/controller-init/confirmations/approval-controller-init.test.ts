import { Messenger } from '@metamask/base-controller';
import { ApprovalController } from '@metamask/approval-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getApprovalControllerMessenger,
  ApprovalControllerMessenger,
} from '../messengers';
import { ApprovalControllerInit } from './approval-controller-init';

jest.mock('@metamask/approval-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<ApprovalControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getApprovalControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('ApprovalControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = ApprovalControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(ApprovalController);
  });

  it('passes the proper arguments to the controller', () => {
    ApprovalControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(ApprovalController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      showApprovalRequest: expect.any(Function),
      typesExcludedFromRateLimiting: expect.any(Array),
    });
  });
});
