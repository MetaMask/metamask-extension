import { Wallet } from '@metamask/wallet';
import { Json } from '@metamask/utils';
import { RootMessenger } from '../lib/messenger';
import { initializeWallet } from './initialization';

jest.mock('@metamask/wallet');
jest.mock('./keyrings', () => ({
  getKeyringBuilders: jest.fn(() => []),
}));
jest.mock('./remote-feature-flags', () => ({
  getRemoteFeatureFlagClientConfigApiService: jest.fn(() => ({
    fetchRemoteFeatureFlags: jest.fn(),
  })),
}));
jest.mock('../../../shared/lib/feature-flags/version-gating', () => ({
  getBaseSemVerVersion: jest.fn(() => '1.2.3'),
}));

const MockWallet = jest.mocked(Wallet);

/**
 * Calls `initializeWallet` with the given persisted state and returns the
 * `remoteFeatureFlagController` instance options the wallet was constructed
 * with.
 *
 * @param state - The persisted state passed to `initializeWallet`.
 * @returns The `remoteFeatureFlagController` instance options.
 */
function getRemoteFeatureFlagOptions(
  state: Record<string, Record<string, Json>>,
) {
  initializeWallet({
    messenger: {} as unknown as RootMessenger,
    state,
    getMetaMetricsId: () => 'metrics-id',
  });
  return MockWallet.mock.calls[0][0].instanceOptions
    .remoteFeatureFlagController;
}

describe('initializeWallet — RemoteFeatureFlagController options', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes prevClientVersion from persisted AppMetadataController.currentAppVersion', () => {
    const options = getRemoteFeatureFlagOptions({
      AppMetadataController: { currentAppVersion: '1.0.0' },
    });

    expect(options?.prevClientVersion).toBe('1.0.0');
  });

  it('leaves prevClientVersion undefined when AppMetadataController state is absent', () => {
    const options = getRemoteFeatureFlagOptions({});

    expect(options?.prevClientVersion).toBeUndefined();
  });

  it('is enabled when onboarding is complete and external services are on', () => {
    const options = getRemoteFeatureFlagOptions({
      OnboardingController: { completedOnboarding: true },
      PreferencesController: { useExternalServices: true },
    });

    expect(options?.disabled).toBe(false);
  });

  it('is disabled when onboarding is incomplete', () => {
    const options = getRemoteFeatureFlagOptions({
      OnboardingController: { completedOnboarding: false },
      PreferencesController: { useExternalServices: true },
    });

    expect(options?.disabled).toBe(true);
  });

  it('is disabled when external services are turned off', () => {
    const options = getRemoteFeatureFlagOptions({
      OnboardingController: { completedOnboarding: true },
      PreferencesController: { useExternalServices: false },
    });

    expect(options?.disabled).toBe(true);
  });

  it('is disabled when neither onboarding nor preferences state is present', () => {
    const options = getRemoteFeatureFlagOptions({});

    expect(options?.disabled).toBe(true);
  });
});
