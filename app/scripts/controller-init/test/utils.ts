import {
  BaseRestrictedControllerMessenger,
  ControllerInitRequest,
} from '../types';

export const CHAIN_ID_MOCK = '0x123';

export function buildControllerInitRequestMock(): jest.Mocked<
  Omit<
    ControllerInitRequest<
      BaseRestrictedControllerMessenger,
      BaseRestrictedControllerMessenger
    >,
    'controllerMessenger' | 'initMessenger'
  >
> {
  return {
    // @ts-expect-error: Partial mock.
    extension: {},
    getCronjobControllerStorageManager: jest.fn(),
    getController: jest.fn(),
    getFlatState: jest.fn(),
    getPermittedAccounts: jest.fn(),
    getProvider: jest.fn(),
    getTransactionMetricsRequest: jest.fn(),
    updateAccountBalanceForTransactionNetwork: jest.fn(),
    offscreenPromise: Promise.resolve(),
    persistedState: {},
    removeAllConnections: jest.fn(),
    setupUntrustedCommunicationEip1193: jest.fn(),
    setLocked: jest.fn(),
    showNotification: jest.fn(),
    preinstalledSnaps: [],
  };
}
