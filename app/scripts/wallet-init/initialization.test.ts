import { Wallet } from '@metamask/wallet';
import type { Encryptor } from '@metamask/keyring-controller';
import type { ConnectivityAdapter } from '@metamask/connectivity-controller';
import { WeakRefObjectMap } from '../lib/WeakRefObjectMap';
import { unrestrictedMethods } from '../controllers/permissions';
import { getAssetsControllerInitMessenger } from './messengers/assets-controller-messenger';
import {
  getAssetsControllerInstanceOptions,
  subscribeToArcTransactionConfirmedRefresh,
} from './instance-options/assets-controller';
import { initializeWallet } from './initialization';
import { setupRemoteFeatureFlagToggle } from './remote-feature-flags';
import { getApprovalControllerInstanceOptions } from './instance-options/approval-controller';
import { getConnectivityControllerInstanceOptions } from './instance-options/connectivity-controller';
import { getAnalyticsControllerInstanceOptions } from './instance-options/analytics-controller';
import { getGasFeeControllerInstanceOptions } from './instance-options/gas-fee-controller';
import { getPasskeyControllerInstanceOptions } from './instance-options/passkey-controller';
import { getKeyringControllerInstanceOptions } from './instance-options/keyring-controller';
import { getRemoteFeatureFlagControllerInstanceOptions } from './instance-options/remote-feature-flag-controller';
import { getStorageServiceInstanceOptions } from './instance-options/storage-service';
import {
  getTransactionControllerInstanceOptions,
  setupTransactionControllerListeners,
} from './instance-options/transaction-controller';
import { getAnalyticsControllerInitMessenger } from './messengers/analytics-controller-messenger';
import { getTransactionControllerInitMessenger } from './messengers/transaction-controller-messenger';
import { getGasFeeControllerInitMessenger } from './messengers/gas-fee-controller-messenger';
import { getSeedlessOnboardingControllerInitMessenger } from './messengers/seedless-onboarding-controller-messenger';
import { getSeedlessOnboardingControllerInstanceOptions } from './instance-options/seedless-onboarding-controller';
import { getClaimsServiceInstanceOptions } from './instance-options/claims-service';
import { getGeolocationApiServiceInstanceOptions } from './instance-options/geolocation-api-service';
import { getConfigRegistryApiServiceInstanceOptions } from './instance-options/config-registry-api-service';
import {
  getShieldApiServiceInstanceOptions,
  getShieldControllerInstanceOptions,
} from './instance-options/shield-controller';
import { getSubscriptionServiceInstanceOptions } from './instance-options/subscription-service';
import { createMockMessenger } from './test-utils';

const mockWalletInit = jest.fn();
const mockNetworkController = {
  addNetwork: jest.fn(),
};
const mockClientController = {
  state: { isUiOpen: true },
};
const mockAssetsController = {
  messenger: { subscribe: jest.fn() },
  getAssets: jest.fn(),
};

jest.mock('@metamask/wallet', () => ({
  Wallet: jest.fn(() => ({
    getInstance: jest.fn((name: string) => {
      if (name === 'AssetsController') {
        return mockAssetsController;
      }
      if (name === 'ClientController') {
        return mockClientController;
      }
      return mockNetworkController;
    }),
    init: mockWalletInit,
  })),
  assetsController: { name: 'AssetsController' },
}));
jest.mock('./instance-options/assets-controller', () => ({
  getAssetsControllerInstanceOptions: jest.fn(() => 'assets-options'),
  subscribeToArcTransactionConfirmedRefresh: jest.fn(),
}));
jest.mock('./messengers/assets-controller-messenger', () => ({
  getAssetsControllerInitMessenger: jest.fn(
    () => 'assets-controller-init-messenger',
  ),
}));
jest.mock('./remote-feature-flags', () => ({
  setupRemoteFeatureFlagToggle: jest.fn(),
}));
jest.mock('./instance-options/analytics-controller', () => ({
  getAnalyticsControllerInstanceOptions: jest.fn(() => 'analytics-options'),
}));
jest.mock('./instance-options/approval-controller', () => ({
  getApprovalControllerInstanceOptions: jest.fn(() => 'approval-options'),
}));
jest.mock('./instance-options/connectivity-controller', () => ({
  getConnectivityControllerInstanceOptions: jest.fn(
    () => 'connectivity-options',
  ),
}));
jest.mock('./instance-options/claims-service', () => ({
  getClaimsServiceInstanceOptions: jest.fn(() => 'claims-options'),
}));
jest.mock('./instance-options/geolocation-api-service', () => ({
  getGeolocationApiServiceInstanceOptions: jest.fn(
    () => 'geolocation-api-service-options',
  ),
}));
jest.mock('./instance-options/config-registry-api-service', () => ({
  getConfigRegistryApiServiceInstanceOptions: jest.fn(
    () => 'config-registry-api-service-options',
  ),
}));
jest.mock('./instance-options/shield-controller', () => ({
  getShieldApiServiceInstanceOptions: jest.fn(
    () => 'shield-api-service-options',
  ),
  getShieldControllerInstanceOptions: jest.fn(
    () => 'shield-controller-options',
  ),
}));
jest.mock('./instance-options/subscription-service', () => ({
  getSubscriptionServiceInstanceOptions: jest.fn(
    () => 'subscription-service-options',
  ),
}));
jest.mock('./instance-options/gas-fee-controller', () => ({
  getGasFeeControllerInstanceOptions: jest.fn(
    () => 'gas-fee-controller-options',
  ),
}));
jest.mock('./instance-options/keyring-controller', () => ({
  getKeyringControllerInstanceOptions: jest.fn(() => 'keyring-options'),
}));
jest.mock('./instance-options/passkey-controller', () => ({
  getPasskeyControllerInstanceOptions: jest.fn(() => 'passkey-options'),
}));
jest.mock('./instance-options/seedless-onboarding-controller', () => ({
  getSeedlessOnboardingControllerInstanceOptions: jest.fn(
    () => 'seedless-onboarding-options',
  ),
}));
jest.mock('./instance-options/remote-feature-flag-controller', () => ({
  getRemoteFeatureFlagControllerInstanceOptions: jest.fn(() => 'rffc-options'),
}));
jest.mock('./instance-options/storage-service', () => ({
  getStorageServiceInstanceOptions: jest.fn(() => 'storage-options'),
}));
jest.mock('./instance-options/transaction-controller', () => ({
  getTransactionControllerInstanceOptions: jest.fn(
    () => 'transaction-controller-options',
  ),
  setupTransactionControllerListeners: jest.fn(),
}));
jest.mock('./messengers/transaction-controller-messenger', () => ({
  getTransactionControllerInitMessenger: jest.fn(
    () => 'transaction-controller-init-messenger',
  ),
}));
jest.mock('./messengers/analytics-controller-messenger', () => ({
  getAnalyticsControllerInitMessenger: jest.fn(
    () => 'analytics-controller-init-messenger',
  ),
}));
jest.mock('./messengers/gas-fee-controller-messenger', () => ({
  getGasFeeControllerInitMessenger: jest.fn(
    () => 'gas-fee-controller-init-messenger',
  ),
}));
jest.mock('./messengers/seedless-onboarding-controller-messenger', () => ({
  getSeedlessOnboardingControllerInitMessenger: jest.fn(
    () => 'seedless-onboarding-controller-init-messenger',
  ),
}));

const MockWallet = jest.mocked(Wallet);
const connectivityAdapter = {} as unknown as ConnectivityAdapter;
const getFlatState = jest.fn(() => ({}) as never);
const getPermittedAccounts = jest.fn(() => []);
const getTransactionMetricsRequest = jest.fn(() => ({}) as never);
const platform = {
  runtime: {
    getURL: jest.fn().mockReturnValue('chrome-extension://mock-id/'),
  },
} as never;

describe('initializeWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletInit.mockResolvedValue([]);
    mockClientController.state.isUiOpen = true;
  });

  it('constructs a Wallet, wiring each builder output to its instanceOptions slot', () => {
    const messenger = createMockMessenger();
    const state = { KeyringController: { vault: 'encrypted-vault-blob' } };

    initializeWallet({
      connectivityAdapter,
      getFlatState,
      getPermittedAccounts,
      getTransactionMetricsRequest,
      infuraProjectId: 'fake-infura-project-id',
      messenger,
      platform,
      state,
    });

    expect(MockWallet).toHaveBeenCalledWith({
      initializationConfigurations: [
        expect.objectContaining({ name: 'AssetsController' }),
      ],
      instanceOptions: {
        analyticsController: 'analytics-options',
        approvalController: 'approval-options',
        assetsController: 'assets-options',
        claimsService: 'claims-options',
        configRegistryApiService: 'config-registry-api-service-options',
        connectivityController: 'connectivity-options',
        gasFeeController: 'gas-fee-controller-options',
        geolocationApiService: 'geolocation-api-service-options',
        keyringController: 'keyring-options',
        networkController: {
          infuraProjectId: 'fake-infura-project-id',
          failoverUrls: {
            '0x1': [],
            '0x10e6': [],
            '0x1237': [],
            '0x13b2': [],
            '0x144': [],
            '0x2105': [],
            '0x38': [],
            '0x3e7': [],
            '0x531': [],
            '0x89': [],
            '0x8f': [],
            '0xa': [],
            '0xa4b1': [],
            '0xa86a': [],
            '0xe708': [],
          },
          analyticsOptions: {
            isRpcEndpointUrlPublic: expect.any(Function),
            rpcServiceEventsSampleRate: expect.any(Number),
          },
        },
        passkeyController: 'passkey-options',
        permissionController: {
          caveatSpecifications: expect.any(Object),
          permissionSpecifications: expect.any(Object),
          unrestrictedMethods,
        },
        seedlessOnboardingController: 'seedless-onboarding-options',
        selectedNetworkController: {
          domainProxyMap: new WeakRefObjectMap(),
        },
        shieldApiService: 'shield-api-service-options',
        shieldController: 'shield-controller-options',
        remoteFeatureFlagController: 'rffc-options',
        storageService: 'storage-options',
        subscriptionService: 'subscription-service-options',
        transactionController: 'transaction-controller-options',
      },
      messenger,
      state,
    });
  });

  it('adds Localhost for a fixture-less extension test build', () => {
    const originalInTest = process.env.IN_TEST;
    const originalJestWorkerId = process.env.JEST_WORKER_ID;
    process.env.IN_TEST = 'true';
    process.env.JEST_WORKER_ID = 'undefined';

    try {
      initializeWallet({
        connectivityAdapter,
        getFlatState,
        getPermittedAccounts,
        getTransactionMetricsRequest,
        infuraProjectId: 'fake-infura-project-id',
        messenger: createMockMessenger(),
        platform,
        state: {},
      });

      expect(mockNetworkController.addNetwork).toHaveBeenCalledWith({
        blockExplorerUrls: [],
        chainId: '0x539',
        defaultRpcEndpointIndex: 0,
        name: 'Localhost 8545',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            type: 'custom',
            url: 'http://localhost:8545',
          },
        ],
      });
    } finally {
      if (originalInTest === undefined) {
        delete process.env.IN_TEST;
      } else {
        process.env.IN_TEST = originalInTest;
      }
      process.env.JEST_WORKER_ID = originalJestWorkerId;
    }
  });

  it('threads the messenger, state, and injected values through to the builders', () => {
    const messenger = createMockMessenger();
    const state = { OnboardingController: { completedOnboarding: true } };
    const encryptor = {} as unknown as Encryptor;
    const showApprovalRequest = jest.fn();

    initializeWallet({
      connectivityAdapter,
      encryptor,
      getFlatState,
      getPermittedAccounts,
      getTransactionMetricsRequest,
      infuraProjectId: 'fake-infura-project-id',
      messenger,
      platform,
      showApprovalRequest,
      state,
    });

    expect(getAssetsControllerInitMessenger).toHaveBeenCalledWith(messenger);
    expect(getAssetsControllerInstanceOptions).toHaveBeenCalledWith({
      getIsUiOpen: expect.any(Function),
      initMessenger: 'assets-controller-init-messenger',
      persistedState: state,
    });
    const { getIsUiOpen } = jest.mocked(getAssetsControllerInstanceOptions).mock
      .calls[0][0];
    expect(getIsUiOpen()).toBe(true);
    mockClientController.state.isUiOpen = false;
    expect(getIsUiOpen()).toBe(false);
    mockClientController.state.isUiOpen = true;

    expect(subscribeToArcTransactionConfirmedRefresh).toHaveBeenCalledWith(
      mockAssetsController,
    );
    expect(getApprovalControllerInstanceOptions).toHaveBeenCalledWith({
      showApprovalRequest,
    });
    expect(getClaimsServiceInstanceOptions).toHaveBeenCalledWith();
    expect(getGeolocationApiServiceInstanceOptions).toHaveBeenCalledWith();
    expect(getConfigRegistryApiServiceInstanceOptions).toHaveBeenCalledWith();
    expect(getShieldApiServiceInstanceOptions).toHaveBeenCalledWith();
    expect(getShieldControllerInstanceOptions).toHaveBeenCalledWith();
    expect(getSubscriptionServiceInstanceOptions).toHaveBeenCalledWith();
    expect(getPasskeyControllerInstanceOptions).toHaveBeenCalledWith({
      messenger,
      platform,
    });
    expect(getSeedlessOnboardingControllerInitMessenger).toHaveBeenCalledWith(
      messenger,
    );
    expect(getSeedlessOnboardingControllerInstanceOptions).toHaveBeenCalledWith(
      {
        initMessenger: 'seedless-onboarding-controller-init-messenger',
      },
    );
    expect(getConnectivityControllerInstanceOptions).toHaveBeenCalledWith({
      connectivityAdapter,
    });
    expect(getAnalyticsControllerInitMessenger).toHaveBeenCalledWith(messenger);
    expect(getAnalyticsControllerInstanceOptions).toHaveBeenCalledWith({
      initMessenger: 'analytics-controller-init-messenger',
      state,
      platform,
    });
    expect(getGasFeeControllerInitMessenger).toHaveBeenCalledWith(messenger);
    expect(getGasFeeControllerInstanceOptions).toHaveBeenCalledWith({
      initMessenger: 'gas-fee-controller-init-messenger',
    });
    expect(getKeyringControllerInstanceOptions).toHaveBeenCalledWith({
      encryptor,
      messenger,
    });
    expect(getRemoteFeatureFlagControllerInstanceOptions).toHaveBeenCalledWith({
      messenger,
      state,
    });
    expect(getStorageServiceInstanceOptions).toHaveBeenCalledWith();
    expect(getTransactionControllerInitMessenger).toHaveBeenCalledWith(
      messenger,
    );
    expect(getTransactionControllerInstanceOptions).toHaveBeenCalledWith({
      initMessenger: 'transaction-controller-init-messenger',
      getFlatState,
      getPermittedAccounts,
      getTransactionMetricsRequest,
    });
    expect(setupTransactionControllerListeners).toHaveBeenCalledWith({
      getTransactionMetricsRequest,
      messenger: 'transaction-controller-init-messenger',
    });
  });

  it('sets up TransactionController listeners before constructing the Wallet, so the TransactionController can emit events to the wallet messenger during initialization', () => {
    const messenger = createMockMessenger();
    const state = { KeyringController: { vault: 'encrypted-vault-blob' } };

    initializeWallet({
      connectivityAdapter,
      getFlatState,
      getPermittedAccounts,
      getTransactionMetricsRequest,
      infuraProjectId: 'fake-infura-project-id',
      messenger,
      platform,
      state,
    });

    const setupListenersCallOrder = jest.mocked(
      setupTransactionControllerListeners,
    ).mock.invocationCallOrder[0];
    const walletConstructorCallOrder = MockWallet.mock.invocationCallOrder[0];

    expect(setupListenersCallOrder).toBeLessThan(walletConstructorCallOrder);
  });
});

describe('initializeWallet — RemoteFeatureFlagController toggle', () => {
  const mockSetupToggle = jest.mocked(setupRemoteFeatureFlagToggle);

  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletInit.mockResolvedValue([]);
    mockClientController.state.isUiOpen = true;
  });

  it('wires the enable/disable toggle over the messenger with a default-preserving baseline', () => {
    const messenger = createMockMessenger();

    initializeWallet({
      connectivityAdapter,
      getFlatState,
      getPermittedAccounts,
      getTransactionMetricsRequest,
      infuraProjectId: 'fake-infura-project-id',
      messenger,
      platform,
      state: { OnboardingController: { completedOnboarding: true } },
    });

    expect(mockSetupToggle).toHaveBeenCalledWith({
      messenger,
      onboardingState: { completedOnboarding: true },
      // `useExternalServices` is absent, so it defaults to on, matching the
      // live `PreferencesController` default.
      preferencesState: { useExternalServices: true },
      authenticationState: { srpSessionData: undefined },
    });
  });

  it('treats an explicit useExternalServices=false as opting out in the baseline', () => {
    initializeWallet({
      connectivityAdapter,
      getFlatState,
      getPermittedAccounts,
      getTransactionMetricsRequest,
      infuraProjectId: 'fake-infura-project-id',
      messenger: createMockMessenger(),
      platform,
      state: { PreferencesController: { useExternalServices: false } },
    });

    expect(mockSetupToggle).toHaveBeenCalledWith(
      expect.objectContaining({
        onboardingState: { completedOnboarding: false },
        preferencesState: { useExternalServices: false },
      }),
    );
  });

  it('seeds the canonical-id comparison from persisted AuthenticationController state', () => {
    const srpSessionData = {
      'srp-1': { profile: { canonicalProfileId: 'canonical-id' } },
    };

    initializeWallet({
      connectivityAdapter,
      getFlatState,
      getPermittedAccounts,
      getTransactionMetricsRequest,
      infuraProjectId: 'fake-infura-project-id',
      messenger: createMockMessenger(),
      platform,
      state: { AuthenticationController: { srpSessionData } },
    });

    expect(mockSetupToggle).toHaveBeenCalledWith(
      expect.objectContaining({
        authenticationState: { srpSessionData },
      }),
    );
  });
});
