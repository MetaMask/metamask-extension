import { Messenger } from '@metamask/base-controller';
import { ErrorReportingService } from '@metamask/error-reporting-service';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getErrorReportingServiceMessenger,
  ErrorReportingServiceMessenger,
} from './messengers';
import { ErrorReportingServiceInit } from './error-reporting-service-init';

jest.mock('@metamask/error-reporting-service');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<ErrorReportingServiceMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getErrorReportingServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('ErrorReportingServiceInit', () => {
  it('initializes the controller', () => {
    const { controller } = ErrorReportingServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(ErrorReportingService);
  });

  it('passes the proper arguments to the controller', () => {
    ErrorReportingServiceInit(getInitRequestMock());

    const controllerMock = jest.mocked(ErrorReportingService);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      captureException: expect.any(Function),
    });
  });
});
