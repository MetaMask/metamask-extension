import ExtensionPlatform from '../../platforms/extension';
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
    currentMigrationVersion: 0,
    // @ts-expect-error: Partial mock.
    extension: {},
    platform: new ExtensionPlatform(),
    getCronjobControllerStorageManager: jest.fn(),
    getController: jest.fn(),
    getFlatState: jest.fn(),
    getPermittedAccounts: jest.fn(),
    getProvider: jest.fn(),
    getTransactionMetricsRequest: jest.fn(),
    getUIState: jest.fn(),
    updateAccountBalanceForTransactionNetwork: jest.fn(),
    offscreenPromise: Promise.resolve(),
    persistedState: {},
    removeAllConnections: jest.fn(),
    setupUntrustedCommunicationEip1193: jest.fn(),
    setLocked: jest.fn(),
    showNotification: jest.fn(),
    showUserConfirmation: jest.fn(),
    preinstalledSnaps: [],
  };
}
