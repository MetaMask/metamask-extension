import { Wallet } from '@metamask/wallet';
import type { Encryptor } from '@metamask/keyring-controller';
import type { ConnectivityAdapter } from '@metamask/connectivity-controller';
import { initializeWallet } from './initialization';
import { setupRemoteFeatureFlagToggle } from './remote-feature-flags';
import { getApprovalControllerInstanceOptions } from './instance-options/approval-controller';
import { getConnectivityControllerInstanceOptions } from './instance-options/connectivity-controller';
import { getKeyringControllerInstanceOptions } from './instance-options/keyring-controller';
import { getRemoteFeatureFlagControllerInstanceOptions } from './instance-options/remote-feature-flag-controller';
import { getStorageServiceInstanceOptions } from './instance-options/storage-service';
import { createMockMessenger } from './test-utils';

jest.mock('@metamask/wallet');
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

const MockWallet = jest.mocked(Wallet);
const connectivityAdapter = {} as unknown as ConnectivityAdapter;

describe('initializeWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockWallet.prototype.init.mockResolvedValue([]);
  });

  it('constructs a Wallet, wiring each builder output to its instanceOptions slot', () => {
    const messenger = createMockMessenger();
    const state = { KeyringController: { vault: 'encrypted-vault-blob' } };

    initializeWallet({
      messenger,
      state,
      connectivityAdapter,
      infuraProjectId: 'fake-infura-project-id',
    });

    expect(MockWallet).toHaveBeenCalledWith({
      messenger,
      state,
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
      },
    });
  });

  it('threads the messenger, state, and injected values through to the builders', () => {
    const messenger = createMockMessenger();
    const state = { OnboardingController: { completedOnboarding: true } };
    const encryptor = {} as unknown as Encryptor;
    const showApprovalRequest = jest.fn();

    initializeWallet({
      messenger,
      state,
      encryptor,
      showApprovalRequest,
      connectivityAdapter,
      infuraProjectId: 'fake-infura-project-id',
    });

    expect(getApprovalControllerInstanceOptions).toHaveBeenCalledWith({
      showApprovalRequest,
    });
    expect(getConnectivityControllerInstanceOptions).toHaveBeenCalledWith({
      connectivityAdapter,
    });
    expect(getKeyringControllerInstanceOptions).toHaveBeenCalledWith({
      messenger,
      encryptor,
    });
    expect(getRemoteFeatureFlagControllerInstanceOptions).toHaveBeenCalledWith({
      messenger,
      state,
    });
    expect(getStorageServiceInstanceOptions).toHaveBeenCalledWith();
  });
});

describe('initializeWallet — RemoteFeatureFlagController toggle', () => {
  const mockSetupToggle = jest.mocked(setupRemoteFeatureFlagToggle);

  beforeEach(() => {
    jest.clearAllMocks();
    MockWallet.prototype.init.mockResolvedValue([]);
  });

  it('wires the enable/disable toggle over the messenger with a default-preserving baseline', () => {
    const messenger = createMockMessenger();

    initializeWallet({
      messenger,
      state: { OnboardingController: { completedOnboarding: true } },
      connectivityAdapter,
      infuraProjectId: 'fake-infura-project-id',
    });

    expect(mockSetupToggle).toHaveBeenCalledWith({
      messenger,
      // `useExternalServices` is absent, so it defaults to on, matching the
      // live `PreferencesController` default.
      preferencesState: { useExternalServices: true },
      onboardingState: { completedOnboarding: true },
    });
  });

  it('treats an explicit useExternalServices=false as opting out in the baseline', () => {
    initializeWallet({
      messenger: createMockMessenger(),
      state: { PreferencesController: { useExternalServices: false } },
      connectivityAdapter,
      infuraProjectId: 'fake-infura-project-id',
    });

    expect(mockSetupToggle).toHaveBeenCalledWith(
      expect.objectContaining({
        preferencesState: { useExternalServices: false },
        onboardingState: { completedOnboarding: false },
      }),
    );
  });
});
