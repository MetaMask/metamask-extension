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
import { MessengerClientInitRequest } from '../types';
import { getConnectivityControllerMessenger } from '../messengers/connectivity';
import { buildControllerInitRequestMock } from '../test/utils';
import { ConnectivityControllerInit } from './connectivity-controller-init';

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<ConnectivityControllerMessenger>
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

    expect(result.messengerClient).toBeInstanceOf(ConnectivityController);
  });

  it('initializes with online status by default', () => {
    const requestMock = buildInitRequestMock();
    const result = ConnectivityControllerInit(requestMock);

    expect(result.messengerClient.state.connectivityStatus).toBe('online');
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

  it('exposes setConnectivityStatus API', () => {
    const requestMock = buildInitRequestMock();
    const result = ConnectivityControllerInit(requestMock);

    expect(result.api?.setConnectivityStatus).toBeDefined();
    expect(typeof result.api?.setConnectivityStatus).toBe('function');
  });

  it('API setConnectivityStatus updates controller state via service', () => {
    const requestMock = buildInitRequestMock();
    const result = ConnectivityControllerInit(requestMock);
    const { messengerClient } = result;

    expect(messengerClient.state.connectivityStatus).toBe('online');

    result.api?.setConnectivityStatus('offline');

    expect(messengerClient.state.connectivityStatus).toBe('offline');
  });

  it('API setConnectivityStatus handles online status', () => {
    const requestMock = buildInitRequestMock();
    const result = ConnectivityControllerInit(requestMock);
    const { messengerClient } = result;

    result.api?.setConnectivityStatus('offline');
    expect(messengerClient.state.connectivityStatus).toBe('offline');

    result.api?.setConnectivityStatus('online');
    expect(messengerClient.state.connectivityStatus).toBe('online');
  });
});
