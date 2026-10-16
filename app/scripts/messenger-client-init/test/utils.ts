import ExtensionPlatform from '../../platforms/extension';
import {
  BaseRestrictedControllerMessenger,
  MessengerClientInitRequest,
} from '../types';

export const CHAIN_ID_MOCK = '0x123';

type ControllerInitRequest = Omit<
  MessengerClientInitRequest<
    BaseRestrictedControllerMessenger,
    BaseRestrictedControllerMessenger
  >,
  'controllerMessenger' | 'initMessenger'
>;

export function buildControllerInitRequestMock(): jest.Mocked<
  ControllerInitRequest &
    Required<
      Pick<
        ControllerInitRequest,
        'networkPolicy' | 'socialOnboardingNetworkPolicy'
      >
    >
> {
  return {
    networkPolicy: {
      update: jest.fn().mockResolvedValue(undefined),
      allowRpcValidation: jest
        .fn()
        .mockResolvedValue(jest.fn().mockResolvedValue(undefined)),
    },
    socialOnboardingNetworkPolicy: {
      beginSocialOnboarding: jest.fn().mockResolvedValue(undefined),
      endSocialOnboarding: jest.fn().mockResolvedValue(undefined),
    },
    applyNetworkPolicyDomains: jest.fn(async (_domains, commit) => commit()),
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
    showNotification: jest.fn(),
    showUserConfirmation: jest.fn(),
    preinstalledSnaps: [],
  };
}
