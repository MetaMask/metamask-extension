import type { Json } from '@metamask/utils';
import type { WalletOptions } from '@metamask/wallet';
import { getBaseSemVerVersion } from '../../../../shared/lib/feature-flags/version-gating';
import type { WalletInitMessenger } from '../initialization';
import { getRemoteFeatureFlagClientConfigApiService } from '../remote-feature-flags';

const REMOTE_FEATURE_FLAG_FETCH_INTERVAL = 15 * 60 * 1000;

type RemoteFeatureFlagControllerInstanceOptions =
  WalletOptions['instanceOptions']['remoteFeatureFlagController'];

/**
 * Build the extension's `RemoteFeatureFlagController` instance options. The
 * `disabled` value is the initial value only (set once at construction); the
 * dynamic enable/disable orchestration lives in `setupRemoteFeatureFlagToggle`.
 *
 * @param options - Options bag.
 * @param options.messenger - Root messenger; resolves the MetaMetrics id from
 * `AnalyticsController` lazily at fetch time.
 * @param options.state - Initial persisted state; `prevClientVersion` is read
 * from `AppMetadataController` so the controller can invalidate cached flags
 * when the client version changes between sessions, and the initial `disabled`
 * value is derived from onboarding and the external-services preference.
 * @returns The extension `RemoteFeatureFlagController` instance options.
 */
export function getRemoteFeatureFlagControllerInstanceOptions({
  messenger,
  state,
}: {
  messenger: WalletInitMessenger;
  state: Record<string, Record<string, Json>>;
}): RemoteFeatureFlagControllerInstanceOptions {
  return {
    clientConfigApiService: getRemoteFeatureFlagClientConfigApiService(),
    getMetaMetricsId: () =>
      messenger.call('AnalyticsController:getState').analyticsId,
    clientVersion: getBaseSemVerVersion(),
    prevClientVersion: state.AppMetadataController?.currentAppVersion as
      | string
      | undefined,
    fetchInterval: REMOTE_FEATURE_FLAG_FETCH_INTERVAL,
    disabled:
      state.OnboardingController?.completedOnboarding !== true ||
      state.PreferencesController?.useExternalServices === false,
  };
}
