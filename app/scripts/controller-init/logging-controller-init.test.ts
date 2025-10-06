import { Messenger } from '@metamask/base-controller';
import { LoggingController } from '@metamask/logging-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getLoggingControllerMessenger,
  LoggingControllerMessenger,
} from './messengers';
import { LoggingControllerInit } from './logging-controller-init';

jest.mock('@metamask/logging-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<LoggingControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getLoggingControllerMessenger(baseMessenger),
    initMessenger: undefined,
    extension: {
      runtime: {
        onInstalled: {
          addListener: jest.fn(),
        },
      },
    },
  };

  // @ts-expect-error: Partial mock.
  return requestMock;
}

describe('LoggingControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = LoggingControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(LoggingController);
  });

  it('passes the proper arguments to the controller', () => {
    LoggingControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(LoggingController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
    });
  });
});
