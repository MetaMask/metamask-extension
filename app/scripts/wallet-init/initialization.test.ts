import { Wallet } from '@metamask/wallet';
import type { Encryptor } from '@metamask/keyring-controller';
import type { ConnectivityAdapter } from '@metamask/connectivity-controller';
import { Json } from '@metamask/utils';
import { initializeWallet } from './initialization';
import { setupRemoteFeatureFlagToggle } from './remote-feature-flags';
import { getApprovalControllerInstanceOptions } from './instance-options/approval-controller';
import { getConnectivityControllerInstanceOptions } from './instance-options/connectivity-controller';
import { getKeyringControllerInstanceOptions } from './instance-options/keyring-controller';
import { getRemoteFeatureFlagControllerInstanceOptions } from './instance-options/remote-feature-flag-controller';
import { getStorageServiceInstanceOptions } from './instance-options/storage-service';
import {
  getTransactionControllerInstanceOptions,
  setupTransactionControllerListeners,
} from './instance-options/transaction-controller';
import { getTransactionControllerInitMessenger } from './messengers/transaction-controller-messenger';
import { preferencesControllerConfiguration } from './instance-options/preferences-controller';
import { createMockMessenger } from './test-utils';

const mockWalletInit = jest.fn();

jest.mock('@metamask/wallet', () => ({
  Wallet: jest.fn(() => ({ init: mockWalletInit })),
}));
jest.mock('./remote-feature-flags', () => ({
  setupRemoteFeatureFlagToggle: jest.fn(),
}));
jest.mock('./instance-options/approval-controller', () => ({
  getApprovalControllerInstanceOptions: jest.fn(() => 'approval-options'),
}));
jest.mock('./instance-options/connectivity-controller', () => ({
  getConnectivityControllerInstanceOptions: jest.fn(
    () => 'connectivity-options',
  ),
}));
jest.mock('./instance-options/keyring-controller', () => ({
  getKeyringControllerInstanceOptions: jest.fn(() => 'keyring-options'),
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
jest.mock('./instance-options/preferences-controller', () => ({
  preferencesControllerConfiguration: { name: 'PreferencesController' },
}));

const MockWallet = jest.mocked(Wallet);
const connectivityAdapter = {} as unknown as ConnectivityAdapter;
const getFlatState = jest.fn(() => ({}) as never);
const getPermittedAccounts = jest.fn(() => []);
const getTransactionMetricsRequest = jest.fn(() => ({}) as never);

describe('initializeWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletInit.mockResolvedValue([]);
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
      state,
    });

    expect(MockWallet).toHaveBeenCalledWith({
      initializationConfigurations: [preferencesControllerConfiguration],
      instanceOptions: {
        approvalController: 'approval-options',
        connectivityController: 'connectivity-options',
        keyringController: 'keyring-options',
        networkController: {
          infuraProjectId: 'fake-infura-project-id',
          failoverUrls: {
            '0x1': [],
            '0x13b2': [],
            '0x2105': [],
            '0x3e7': [],
            '0x531': [],
            '0x89': [],
            '0x8f': [],
            '0xa': [],
            '0xa4b1': [],
            '0xa86a': [],
            '0xe708': [],
          },
        },
        remoteFeatureFlagController: 'rffc-options',
        storageService: 'storage-options',
        transactionController: 'transaction-controller-options',
      },
      messenger,
      state: {
        ...state,
        PreferencesController: {
          currentLocale: '',
        },
      },
    });
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
      showApprovalRequest,
      state,
    });

    expect(getApprovalControllerInstanceOptions).toHaveBeenCalledWith({
      showApprovalRequest,
    });
    expect(getConnectivityControllerInstanceOptions).toHaveBeenCalledWith({
      connectivityAdapter,
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
});

describe('initializeWallet — RemoteFeatureFlagController toggle', () => {
  const mockSetupToggle = jest.mocked(setupRemoteFeatureFlagToggle);

  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletInit.mockResolvedValue([]);
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
      state: { OnboardingController: { completedOnboarding: true } },
    });

    expect(mockSetupToggle).toHaveBeenCalledWith({
      messenger,
      onboardingState: { completedOnboarding: true },
      // `useExternalServices` is absent, so it defaults to on, matching the
      // live `PreferencesController` default.
      preferencesState: { useExternalServices: true },
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
      state: { PreferencesController: { useExternalServices: false } },
    });

    expect(mockSetupToggle).toHaveBeenCalledWith(
      expect.objectContaining({
        onboardingState: { completedOnboarding: false },
        preferencesState: { useExternalServices: false },
      }),
    );
  });
});

describe('initializeWallet — PreferencesController override', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Calls `initializeWallet` and returns the options the wallet was
   * constructed with.
   *
   * @param args - Overrides for the `initializeWallet` call.
   * @param args.state - The persisted state.
   * @param args.initLangCode - The initial locale code.
   * @returns The wallet constructor options.
   */
  function getWalletOptions({
    state = {},
    initLangCode,
  }: {
    state?: Record<string, Record<string, Json>>;
    initLangCode?: string;
  }) {
    initializeWallet({
      messenger: createMockMessenger(),
      state,
      connectivityAdapter,
      getFlatState,
      getPermittedAccounts,
      getTransactionMetricsRequest,
      infuraProjectId: 'fake-infura-project-id',
      initLangCode,
    });
    return MockWallet.mock.calls[MockWallet.mock.calls.length - 1][0];
  }

  it('overrides the default PreferencesController via initializationConfigurations', () => {
    const { initializationConfigurations } = getWalletOptions({});

    expect(initializationConfigurations).toContain(
      preferencesControllerConfiguration,
    );
  });

  it('seeds currentLocale from initLangCode, with persisted state taking precedence', () => {
    expect(
      getWalletOptions({ initLangCode: 'fr' }).state?.PreferencesController
        ?.currentLocale,
    ).toBe('fr');

    expect(
      getWalletOptions({
        state: { PreferencesController: { currentLocale: 'de' } },
        initLangCode: 'fr',
      }).state?.PreferencesController?.currentLocale,
    ).toBe('de');
  });

  it('lets a persisted empty-string currentLocale win over initLangCode', () => {
    // The merge is a spread, not a `??`/`||` fallback, so a persisted empty
    // string still takes precedence over the seed.
    expect(
      getWalletOptions({
        state: { PreferencesController: { currentLocale: '' } },
        initLangCode: 'fr',
      }).state?.PreferencesController?.currentLocale,
    ).toBe('');
  });

  it('defaults currentLocale to an empty string when no locale is provided', () => {
    expect(
      getWalletOptions({}).state?.PreferencesController?.currentLocale,
    ).toBe('');
  });

  it('seeds currentLocale while preserving other persisted PreferencesController state', () => {
    expect(
      getWalletOptions({
        state: { PreferencesController: { useExternalServices: false } },
        initLangCode: 'fr',
      }).state?.PreferencesController,
    ).toStrictEqual({ currentLocale: 'fr', useExternalServices: false });
  });
});
