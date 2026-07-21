import { Wallet } from '@metamask/wallet';
import type { Encryptor } from '@metamask/keyring-controller';
import type { ConnectivityAdapter } from '@metamask/connectivity-controller';
import { initializeWallet } from './initialization';
import { setupRemoteFeatureFlagToggle } from './remote-feature-flags';
import { getApprovalControllerInstanceOptions } from './instance-options/approval-controller';
import { getConnectivityControllerInstanceOptions } from './instance-options/connectivity-controller';
import { getPasskeyControllerInstanceOptions } from './instance-options/passkey-controller';
import { getKeyringControllerInstanceOptions } from './instance-options/keyring-controller';
import { getRemoteFeatureFlagControllerInstanceOptions } from './instance-options/remote-feature-flag-controller';
import { getStorageServiceInstanceOptions } from './instance-options/storage-service';
import {
  getTransactionControllerInstanceOptions,
  setupTransactionControllerListeners,
} from './instance-options/transaction-controller';
import { getTransactionControllerInitMessenger } from './messengers/transaction-controller-messenger';
import { getSeedlessOnboardingControllerInitMessenger } from './messengers/seedless-onboarding-controller-messenger';
import { getSeedlessOnboardingControllerInstanceOptions } from './instance-options/seedless-onboarding-controller';
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
        passkeyController: 'passkey-options',
        seedlessOnboardingController: 'seedless-onboarding-options',
        remoteFeatureFlagController: 'rffc-options',
        storageService: 'storage-options',
        transactionController: 'transaction-controller-options',
      },
      messenger,
      state,
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
      platform,
      showApprovalRequest,
      state,
    });

    expect(getApprovalControllerInstanceOptions).toHaveBeenCalledWith({
      showApprovalRequest,
    });
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
      platform,
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
});
