import { assert } from '@metamask/utils';
import {
  ClientConfigApiService,
  ClientType,
  DistributionType,
  EnvironmentType,
  RemoteFeatureFlagController,
} from '@metamask/remote-feature-flag-controller';
import { ENVIRONMENT } from '../../../development/build/constants';
import { previousValueComparator } from '../lib/util';
import { ControllerInitFunction } from './types';
import {
  RemoteFeatureFlagControllerInitMessenger,
  RemoteFeatureFlagControllerMessenger,
} from './messengers';

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
 * Initialize the remote feature flag controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const RemoteFeatureFlagControllerInit: ControllerInitFunction<
  RemoteFeatureFlagController,
  RemoteFeatureFlagControllerMessenger,
  RemoteFeatureFlagControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const onboardingState = initMessenger.call('OnboardingController:getState');
  const preferencesState = initMessenger.call('PreferencesController:getState');
  const { distribution, environment } = getConfigForRemoteFeatureFlagRequest();

  let canUseExternalServices = preferencesState.useExternalServices === true;
  let hasCompletedOnboarding = onboardingState.completedOnboarding === true;

  /**
   * Uses state from multiple controllers to determine if the remote feature flag
   * controller should be disabled or not.
   *
   * @returns `true` if it should be disabled, `false` otherwise.
   */
  const getIsDisabled = () =>
    !hasCompletedOnboarding || !canUseExternalServices;

  const controller = new RemoteFeatureFlagController({
    state: persistedState.RemoteFeatureFlagController,
    messenger: controllerMessenger,
    fetchInterval: 15 * 60 * 1000, // 15 minutes in milliseconds
    disabled: getIsDisabled(),
    getMetaMetricsId: () =>
      initMessenger.call('MetaMetricsController:getMetaMetricsId'),
    clientConfigApiService: new ClientConfigApiService({
      fetch: globalThis.fetch.bind(globalThis),
      config: {
        client: ClientType.Extension,
        distribution,
        environment,
      },
    }),
  });

  /**
   * Enables or disables the controller based on the current state of other
   * controllers.
   */
  function toggle() {
    const shouldBeDisabled = getIsDisabled();
    if (shouldBeDisabled) {
      controller.disable();
    } else {
      controller.enable();
      controller.updateRemoteFeatureFlags().catch((error) => {
        console.error('Failed to update remote feature flags:', error);
      });
    }
  }

  /**
   * Subscribe to relevant state changes in the Onboarding Controller
   * to collect information that helps determine if we can fetch remote
   * feature flags.
   */
  initMessenger.subscribe(
    'PreferencesController:stateChange',
    previousValueComparator((prevState, currState) => {
      const { useExternalServices: prevUseExternalServices } = prevState;
      const { useExternalServices: currUseExternalServices } = currState;
      const hasChanged = currUseExternalServices !== prevUseExternalServices;
      if (hasChanged) {
        canUseExternalServices = currUseExternalServices === true;
        toggle();
      }
      return true;
    }, preferencesState),
  );

  /**
   * Subscribe to relevant state changes in the Onboarding Controller
   * to collect information that helps determine if we can fetch remote
   * feature flags.
   */
  initMessenger.subscribe(
    'OnboardingController:stateChange',
    previousValueComparator((prevState, currState) => {
      const { completedOnboarding: prevCompletedOnboarding } = prevState;
      const { completedOnboarding: currCompletedOnboarding } = currState;
      // yes, it is possible for completedOnboarding to change back to `false`
      // after it has been `true`
      const hasChanged = currCompletedOnboarding !== prevCompletedOnboarding;
      if (hasChanged) {
        hasCompletedOnboarding = currCompletedOnboarding === true;
        toggle();
      }
      return true;
    }, onboardingState),
  );

  return {
    controller,
  };
};
