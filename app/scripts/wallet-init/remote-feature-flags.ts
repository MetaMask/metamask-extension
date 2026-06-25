import { assert } from '@metamask/utils';
import { Messenger } from '@metamask/messenger';
import {
  ClientConfigApiService,
  ClientType,
  DistributionType,
  EnvironmentType,
  type RemoteFeatureFlagControllerEnableAction,
  type RemoteFeatureFlagControllerDisableAction,
  type RemoteFeatureFlagControllerUpdateRemoteFeatureFlagsAction,
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

type RemoteFeatureFlagToggleActions =
  | RemoteFeatureFlagControllerEnableAction
  | RemoteFeatureFlagControllerDisableAction
  | RemoteFeatureFlagControllerUpdateRemoteFeatureFlagsAction;

type RemoteFeatureFlagToggleParentMessenger = RootMessenger<
  RemoteFeatureFlagToggleActions,
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
 * complete and external services are enabled. The controller is driven entirely
 * over the messenger, so no controller instance needs to be passed in.
 *
 * @param options - Options bag.
 * @param options.messenger - The root messenger to delegate from; a namespaced
 * child is created internally, subscribed on, and used to call the
 * `RemoteFeatureFlagController` enable/disable/update actions.
 * @param options.preferencesState - The initial `PreferencesController` state.
 * @param options.onboardingState - The initial `OnboardingController` state.
 */
export function setupRemoteFeatureFlagToggle({
  messenger,
  preferencesState,
  onboardingState,
}: {
  messenger: RemoteFeatureFlagToggleParentMessenger;
  preferencesState: Pick<PreferencesControllerState, 'useExternalServices'>;
  onboardingState: Pick<OnboardingControllerState, 'completedOnboarding'>;
}): void {
  const toggleMessenger = new Messenger<
    'RemoteFeatureFlagToggle',
    RemoteFeatureFlagToggleActions,
    | PreferencesControllerStateChangeEvent
    | OnboardingControllerStateChangeEvent,
    RemoteFeatureFlagToggleParentMessenger
  >({
    namespace: 'RemoteFeatureFlagToggle',
    parent: messenger,
  });
  messenger.delegate({
    messenger: toggleMessenger,
    actions: [
      'RemoteFeatureFlagController:enable',
      'RemoteFeatureFlagController:disable',
      'RemoteFeatureFlagController:updateRemoteFeatureFlags',
    ],
    events: [
      'PreferencesController:stateChange',
      'OnboardingController:stateChange',
    ],
  });

  let canUseExternalServices = preferencesState.useExternalServices === true;
  let hasCompletedOnboarding = onboardingState.completedOnboarding === true;

  const toggle = () => {
    if (!hasCompletedOnboarding || !canUseExternalServices) {
      toggleMessenger.call('RemoteFeatureFlagController:disable');
    } else {
      toggleMessenger.call('RemoteFeatureFlagController:enable');
      toggleMessenger
        .call('RemoteFeatureFlagController:updateRemoteFeatureFlags')
        .catch((error) => {
          console.error('Failed to update remote feature flags:', error);
        });
    }
  };

  toggleMessenger.subscribe(
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

  toggleMessenger.subscribe(
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
