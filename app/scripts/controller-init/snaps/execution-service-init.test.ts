import {
  IframeExecutionService,
  OffscreenExecutionService,
} from '@metamask/snaps-controllers';
import { Messenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  ExecutionServiceMessenger,
  getExecutionServiceMessenger,
} from '../messengers/snaps';
import { ExecutionServiceInit } from './execution-service-init';

jest.mock('@metamask/snaps-controllers');
jest.mock('../../../../shared/modules/mv3.utils', () => ({
  isManifestV3: true,
}));

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<ExecutionServiceMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getExecutionServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('ExecutionServiceInit', () => {
  it('initializes the iframe execution service if `chrome.offscreen` is not available', () => {
    const { controller } = ExecutionServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(IframeExecutionService);
  });

  it('does not store state', () => {
    const { memStateKey, persistedStateKey } =
      ExecutionServiceInit(getInitRequestMock());

    expect(memStateKey).toBeNull();
    expect(persistedStateKey).toBeNull();
  });

  it('initializes the offscreen execution service if `chrome.offscreen` is available', () => {
    Object.defineProperty(global, 'chrome', {
      value: {
        offscreen: {},
      },
    });

    const { controller } = ExecutionServiceInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(OffscreenExecutionService);
  });

  it('passes the proper arguments to the service', () => {
    Object.defineProperty(global, 'chrome', {
      value: {
        offscreen: {},
      },
    });

    ExecutionServiceInit(getInitRequestMock());

    const controllerMock = jest.mocked(OffscreenExecutionService);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      offscreenPromise: expect.any(Promise),
      setupSnapProvider: expect.any(Function),
    });
  });
});
