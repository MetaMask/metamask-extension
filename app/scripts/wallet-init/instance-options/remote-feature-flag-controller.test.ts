import type { Json } from '@metamask/utils';
import { getRemoteFeatureFlagClientConfigApiService } from '../remote-feature-flags';
import { getBaseSemVerVersion } from '../../../../shared/lib/feature-flags/version-gating';
import { createMockMessenger } from '../test-utils';
import { getRemoteFeatureFlagControllerInstanceOptions } from './remote-feature-flag-controller';

jest.mock('../remote-feature-flags', () => ({
  getRemoteFeatureFlagClientConfigApiService: jest.fn(() => ({
    fetchRemoteFeatureFlags: jest.fn(),
  })),
}));
jest.mock('../../../../shared/lib/feature-flags/version-gating', () => ({
  getBaseSemVerVersion: jest.fn(() => '1.2.3'),
}));

/**
 * Build the `RemoteFeatureFlagController` instance options with a messenger
 * whose `AnalyticsController:getState` resolves to the given metaMetrics id.
 *
 * @param state - The persisted state passed to the builder.
 * @param analyticsId - The metaMetrics id the messenger resolves.
 * @returns The built instance options.
 */
function buildOptions(
  state: Record<string, Record<string, Json>>,
  analyticsId = 'metrics-id',
) {
  const messenger = createMockMessenger();
  messenger.registerActionHandler('AnalyticsController:getState', () => ({
    analyticsId,
    optedIn: false,
  }));
  return getRemoteFeatureFlagControllerInstanceOptions({ messenger, state });
}

describe('getRemoteFeatureFlagControllerInstanceOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds the client config API service via the extension helper', () => {
    const options = buildOptions({});

    expect(getRemoteFeatureFlagClientConfigApiService).toHaveBeenCalledTimes(1);
    expect(options.clientConfigApiService).toBe(
      jest.mocked(getRemoteFeatureFlagClientConfigApiService).mock.results[0]
        .value,
    );
  });

  it('resolves the MetaMetrics id from AnalyticsController via the messenger', () => {
    const options = buildOptions({}, 'metrics-id');

    expect(options.getMetaMetricsId?.()).toBe('metrics-id');
  });

  it('uses the configured client version and 15-minute fetch interval', () => {
    const options = buildOptions({});

    expect(getBaseSemVerVersion).toHaveBeenCalled();
    expect(options.clientVersion).toBe('1.2.3');
    expect(options.fetchInterval).toBe(15 * 60 * 1000);
  });

  it('reads prevClientVersion from persisted AppMetadataController state', () => {
    const options = buildOptions({
      AppMetadataController: { currentAppVersion: '1.0.0' },
    });

    expect(options.prevClientVersion).toBe('1.0.0');
  });

  it('leaves prevClientVersion undefined when AppMetadataController state is absent', () => {
    const options = buildOptions({});

    expect(options.prevClientVersion).toBeUndefined();
  });

  it('is enabled when onboarding is complete and external services are on', () => {
    const options = buildOptions({
      OnboardingController: { completedOnboarding: true },
      PreferencesController: { useExternalServices: true },
    });

    expect(options.disabled).toBe(false);
  });

  it('is disabled when onboarding is incomplete', () => {
    const options = buildOptions({
      OnboardingController: { completedOnboarding: false },
      PreferencesController: { useExternalServices: true },
    });

    expect(options.disabled).toBe(true);
  });

  it('is disabled when external services are turned off', () => {
    const options = buildOptions({
      OnboardingController: { completedOnboarding: true },
      PreferencesController: { useExternalServices: false },
    });

    expect(options.disabled).toBe(true);
  });

  it('is disabled when neither onboarding nor preferences state is present', () => {
    const options = buildOptions({});

    expect(options.disabled).toBe(true);
  });

  it('stays enabled when onboarding is complete and useExternalServices is absent (defaults to on)', () => {
    const options = buildOptions({
      OnboardingController: { completedOnboarding: true },
      PreferencesController: {},
    });

    expect(options.disabled).toBe(false);
  });
});
