import { assert, type Json } from '@metamask/utils';
import type { WalletOptions } from '@metamask/wallet';
import {
  ClientConfigApiService,
  ClientType,
  DistributionType,
  EnvironmentType,
} from '@metamask/remote-feature-flag-controller';
import {
  ENVIRONMENT,
  type MetaMaskBuildEnvironment,
} from '../../../../shared/constants/build';
import { getBaseSemVerVersion } from '../../../../shared/lib/feature-flags/version-gating';
import type { WalletInitMessenger } from '../types';

const REMOTE_FEATURE_FLAG_FETCH_INTERVAL = 15 * 60 * 1000;

type MetaMaskBuildType = 'flask' | 'main' | 'beta' | 'experimental';

const BUILD_TYPE_MAPPING: Record<MetaMaskBuildType, DistributionType> = {
  flask: DistributionType.Flask,
  main: DistributionType.Main,
  beta: DistributionType.Beta,
  // Experimental builds use main distribution.
  experimental: DistributionType.Main,
};

const ENVIRONMENT_MAPPING: Partial<
  Record<MetaMaskBuildEnvironment, EnvironmentType>
> = {
  [ENVIRONMENT.DEVELOPMENT]: EnvironmentType.Development,
  [ENVIRONMENT.RELEASE_CANDIDATE]: EnvironmentType.ReleaseCandidate,
  [ENVIRONMENT.PRODUCTION]: EnvironmentType.Production,
};

/**
 * Derive the distribution and environment the remote feature flag service
 * should request for, from the build-time environment variables.
 *
 * @returns The distribution and environment for the client config request.
 */
export function getConfigForRemoteFeatureFlagRequest() {
  assert(process.env.METAMASK_BUILD_TYPE, 'METAMASK_BUILD_TYPE is not defined');
  assert(
    process.env.METAMASK_ENVIRONMENT,
    'METAMASK_ENVIRONMENT is not defined',
  );
  const buildType = process.env.METAMASK_BUILD_TYPE;

  const distribution =
    BUILD_TYPE_MAPPING[buildType as MetaMaskBuildType] || DistributionType.Main;

  let environment =
    ENVIRONMENT_MAPPING[
      process.env.METAMASK_ENVIRONMENT as MetaMaskBuildEnvironment
    ] || EnvironmentType.Development;

  if (buildType === 'experimental') {
    environment = EnvironmentType.Exp;
  }

  return { distribution, environment };
}

/**
 * Build the extension's `ClientConfigApiService`, configured for the extension
 * client type and the current build's distribution and environment. This is
 * injected into the wallet-owned `RemoteFeatureFlagController` via
 * `instanceOptions.remoteFeatureFlagController.clientConfigApiService`.
 *
 * @returns The configured client config API service.
 */
export function getRemoteFeatureFlagClientConfigApiService() {
  const { distribution, environment } = getConfigForRemoteFeatureFlagRequest();

  return new ClientConfigApiService({
    fetch: globalThis.fetch.bind(globalThis),
    config: {
      client: ClientType.Extension,
      distribution,
      environment,
    },
  });
}

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
