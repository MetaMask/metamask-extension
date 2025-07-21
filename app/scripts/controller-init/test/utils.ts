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
    getCronjobControllerStorageManager: jest.fn(),
    getController: jest.fn(),
    getFlatState: jest.fn(),
    getGlobalChainId: jest.fn().mockReturnValue(CHAIN_ID_MOCK),
    getPermittedAccounts: jest.fn(),
    getProvider: jest.fn(),
    getTransactionMetricsRequest: jest.fn(),
    updateAccountBalanceForTransactionNetwork: jest.fn(),
    offscreenPromise: Promise.resolve(),
    persistedState: {},
    removeAllConnections: jest.fn(),
    setupUntrustedCommunicationEip1193: jest.fn(),
    showNotification: jest.fn(),
    trackEvent: jest.fn(),
    getMetaMetricsId: jest.fn(),
    preinstalledSnaps: [],
    refreshOAuthToken: jest.fn(),
    revokeAndGetNewRefreshToken: jest.fn(),
  };
}
