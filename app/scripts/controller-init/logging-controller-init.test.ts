import { Messenger } from '@metamask/base-controller';
import { LoggingController, LogType } from '@metamask/logging-controller';
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

  it('logs the previous and current version when the client is updated', () => {
    const request = getInitRequestMock();
    const { controller } = LoggingControllerInit(request);

    expect(controller.add).not.toHaveBeenCalled();

    const listener = jest.mocked(
      request.extension.runtime.onInstalled.addListener,
    ).mock.calls[0][0];

    listener({ reason: 'install', temporary: false });
    expect(controller.add).not.toHaveBeenCalled();

    listener({ reason: 'update', previousVersion: '1.0.0', temporary: false });

    expect(controller.add).toHaveBeenCalledWith({
      type: LogType.GenericLog,
      data: {
        event: 'Extension version update',
        previousVersion: '1.0.0',
        version: process.env.METAMASK_VERSION,
      },
    });
  });
});
