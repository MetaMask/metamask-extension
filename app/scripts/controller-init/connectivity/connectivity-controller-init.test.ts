import { ConnectivityController } from '@metamask/connectivity-controller';
import type {
  ConnectivityControllerMessenger,
  ConnectivityControllerActions,
  ConnectivityControllerEvents,
} from '@metamask/connectivity-controller';
import {
  Messenger,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import { ControllerInitRequest } from '../types';
import { getConnectivityControllerMessenger } from '../messengers/connectivity';
import { buildControllerInitRequestMock } from '../test/utils';
import { ConnectivityControllerInit } from './connectivity-controller-init';

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<ConnectivityControllerMessenger>
> {
  const baseControllerMessenger = new Messenger<
    MockAnyNamespace,
    ConnectivityControllerActions,
    ConnectivityControllerEvents
  >({ namespace: MOCK_ANY_NAMESPACE });

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getConnectivityControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('ConnectivityControllerInit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    const result = ConnectivityControllerInit(requestMock);

    expect(result.controller).toBeInstanceOf(ConnectivityController);
  });

  it('initializes with online status by default', () => {
    const requestMock = buildInitRequestMock();
    const result = ConnectivityControllerInit(requestMock);

    expect(result.controller.state.connectivityStatus).toBe('online');
  });

  it('uses default memStateKey (controller name)', () => {
    const requestMock = buildInitRequestMock();
    const result = ConnectivityControllerInit(requestMock);

    // memStateKey is undefined, which means it defaults to controller name
    expect(result.memStateKey).toBeUndefined();
  });

  it('does not persist state (connectivity is ephemeral)', () => {
    const requestMock = buildInitRequestMock();
    const result = ConnectivityControllerInit(requestMock);

    // persistedStateKey is null because connectivity status should not be persisted
    expect(result.persistedStateKey).toBeNull();
  });

  it('exposes setDeviceConnectivityStatus API', () => {
    const requestMock = buildInitRequestMock();
    const result = ConnectivityControllerInit(requestMock);

    expect(result.api?.setDeviceConnectivityStatus).toBeDefined();
    expect(typeof result.api?.setDeviceConnectivityStatus).toBe('function');
  });

  it('API setDeviceConnectivityStatus updates controller state via service', () => {
    const requestMock = buildInitRequestMock();
    const result = ConnectivityControllerInit(requestMock);
    const { controller } = result;

    expect(controller.state.connectivityStatus).toBe('online');

    result.api?.setDeviceConnectivityStatus('offline');

    expect(controller.state.connectivityStatus).toBe('offline');
  });

  it('API setDeviceConnectivityStatus handles online status', () => {
    const requestMock = buildInitRequestMock();
    const result = ConnectivityControllerInit(requestMock);
    const { controller } = result;

    result.api?.setDeviceConnectivityStatus('offline');
    expect(controller.state.connectivityStatus).toBe('offline');

    result.api?.setDeviceConnectivityStatus('online');
    expect(controller.state.connectivityStatus).toBe('online');
  });
});
