import { assert } from '@metamask/utils';
import {
  ClientConfigApiService,
  ClientType,
  DistributionType,
  EnvironmentType,
  type RemoteFeatureFlagController,
} from '@metamask/remote-feature-flag-controller';
import { ENVIRONMENT } from '../../../shared/constants/build';
import { previousValueComparator } from '../lib/util';
import { RootMessenger } from '../lib/messenger';
import type {
  PreferencesControllerState,
  PreferencesControllerStateChangeEvent,
} from '../controllers/preferences-controller';
import type {
  OnboardingControllerState,
  OnboardingControllerStateChangeEvent,
} from '../controllers/onboarding';

const BUILD_TYPE_MAPPING = {
  flask: DistributionType.Flask,
  main: DistributionType.Main,
  beta: DistributionType.Beta,
  // Experimental builds use main distribution.
  experimental: DistributionType.Main,
};

const ENVIRONMENT_MAPPING = {
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
    BUILD_TYPE_MAPPING[buildType as keyof typeof BUILD_TYPE_MAPPING] ||
    DistributionType.Main;

  let environment =
    ENVIRONMENT_MAPPING[
      process.env.METAMASK_ENVIRONMENT as keyof typeof ENVIRONMENT_MAPPING
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

type RemoteFeatureFlagToggleMessenger = RootMessenger<
  never,
  PreferencesControllerStateChangeEvent | OnboardingControllerStateChangeEvent
>;

/**
 * Wire the extension-side enable/disable orchestration for the wallet-owned
 * `RemoteFeatureFlagController`.
 *
 * The controller is constructed (through `@metamask/wallet`) with an initial
 * `disabled` value; this keeps it in sync as the user completes onboarding or
 * toggles the external-services preference, and refreshes the flags whenever
 * the controller is (re-)enabled. Flags are only fetched once onboarding is
 * complete and external services are enabled.
 *
 * @param options - Options bag.
 * @param options.messenger - The root messenger to subscribe on.
 * @param options.remoteFeatureFlagController - The wallet-owned controller.
 * @param options.preferencesState - The initial `PreferencesController` state.
 * @param options.onboardingState - The initial `OnboardingController` state.
 */
export function setupRemoteFeatureFlagToggle({
  messenger,
  remoteFeatureFlagController,
  preferencesState,
  onboardingState,
}: {
  messenger: RemoteFeatureFlagToggleMessenger;
  remoteFeatureFlagController: Pick<
    RemoteFeatureFlagController,
    'enable' | 'disable' | 'updateRemoteFeatureFlags'
  >;
  preferencesState: PreferencesControllerState;
  onboardingState: OnboardingControllerState;
}): void {
  let canUseExternalServices = preferencesState.useExternalServices === true;
  let hasCompletedOnboarding = onboardingState.completedOnboarding === true;

  const toggle = () => {
    if (!hasCompletedOnboarding || !canUseExternalServices) {
      remoteFeatureFlagController.disable();
    } else {
      remoteFeatureFlagController.enable();
      remoteFeatureFlagController.updateRemoteFeatureFlags().catch((error) => {
        console.error('Failed to update remote feature flags:', error);
      });
    }
  };

  messenger.subscribe(
    'PreferencesController:stateChange',
    previousValueComparator((prevState, currState) => {
      const { useExternalServices: prev } = prevState;
      const { useExternalServices: curr } = currState;
      if (curr !== prev) {
        canUseExternalServices = curr === true;
        toggle();
      }
      return true;
    }, preferencesState),
  );

  messenger.subscribe(
    'OnboardingController:stateChange',
    previousValueComparator((prevState, currState) => {
      const { completedOnboarding: prev } = prevState;
      const { completedOnboarding: curr } = currState;
      if (curr !== prev) {
        hasCompletedOnboarding = curr === true;
        toggle();
      }
      return true;
    }, onboardingState),
  );
}
