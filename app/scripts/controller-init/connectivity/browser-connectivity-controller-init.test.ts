import {
  Messenger,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import { ControllerInitRequest } from '../types';
import { getBrowserConnectivityControllerMessenger } from '../messengers/connectivity';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  BrowserConnectivityControllerMessenger,
  BrowserConnectivityControllerActions,
  BrowserConnectivityControllerEvents,
} from '../../controllers/connectivity/types';
import { BrowserConnectivityController } from '../../controllers/connectivity/browser-connectivity-controller';
import { BrowserConnectivityControllerInit } from './browser-connectivity-controller-init';

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<BrowserConnectivityControllerMessenger>
> {
  const baseControllerMessenger = new Messenger<
    MockAnyNamespace,
    BrowserConnectivityControllerActions,
    BrowserConnectivityControllerEvents
  >({ namespace: MOCK_ANY_NAMESPACE });

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getBrowserConnectivityControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('BrowserConnectivityControllerInit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      BrowserConnectivityControllerInit(requestMock).controller,
    ).toBeInstanceOf(BrowserConnectivityController);
  });

  it('uses default memStateKey (controller name)', () => {
    const requestMock = buildInitRequestMock();
    const result = BrowserConnectivityControllerInit(requestMock);
    // memStateKey is undefined, which means it defaults to controller name
    expect(result.memStateKey).toBeUndefined();
  });

  it('uses default persistedStateKey (controller name)', () => {
    const requestMock = buildInitRequestMock();
    const result = BrowserConnectivityControllerInit(requestMock);
    // persistedStateKey is undefined, which means it defaults to controller name
    expect(result.persistedStateKey).toBeUndefined();
  });
});
