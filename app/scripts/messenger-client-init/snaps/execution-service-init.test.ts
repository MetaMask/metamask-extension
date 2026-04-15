import {
  ExecutionServiceMessenger,
  IframeExecutionService,
  OffscreenExecutionService,
} from '@metamask/snaps-controllers';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { getExecutionServiceMessenger } from '../messengers/snaps';
import { getRootMessenger } from '../../lib/messenger';
import { ExecutionServiceInit } from './execution-service-init';

jest.mock('@metamask/snaps-controllers');
jest.mock('../../../../shared/lib/mv3.utils', () => ({
  isManifestV3: true,
}));

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<ExecutionServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getExecutionServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('ExecutionServiceInit', () => {
  it('initializes the iframe execution service if `chrome.offscreen` is not available', () => {
    const { messengerClient } = ExecutionServiceInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(IframeExecutionService);
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

    const { messengerClient } = ExecutionServiceInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(OffscreenExecutionService);
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
