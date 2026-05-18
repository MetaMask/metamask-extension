import ExtensionPlatform from '../../platforms/extension';
import {
  BaseRestrictedControllerMessenger,
  MessengerClientInitRequest,
} from '../types';

export const CHAIN_ID_MOCK = '0x123';

export function buildControllerInitRequestMock(): jest.Mocked<
  Omit<
    MessengerClientInitRequest<
      BaseRestrictedControllerMessenger,
      BaseRestrictedControllerMessenger
    >,
    'controllerMessenger' | 'initMessenger'
  >
> {
  return {
    currentMigrationVersion: 0,
    ensureOnboardingComplete: jest.fn().mockResolvedValue(undefined),
    // @ts-expect-error: Partial mock.
    extension: {},
    platform: new ExtensionPlatform(),
    getCronjobControllerStorageManager: jest.fn(),
    getMessengerClient: jest.fn(),
    getFlatState: jest.fn(),
    getPermittedAccounts: jest.fn(),
    getProvider: jest.fn(),
    getTransactionMetricsRequest: jest.fn(),
    getUIState: jest.fn(),
    offscreenPromise: Promise.resolve(),
    persistedState: {},
    setupUntrustedCommunicationEip1193: jest.fn(),
    setLocked: jest.fn(),
    showNotification: jest.fn(),
    showUserConfirmation: jest.fn(),
    preinstalledSnaps: [],
  };
}
