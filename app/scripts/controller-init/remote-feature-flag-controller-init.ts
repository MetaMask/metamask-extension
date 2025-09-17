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

  const distribution =
    BUILD_TYPE_MAPPING[
      process.env.METAMASK_BUILD_TYPE as keyof typeof BUILD_TYPE_MAPPING
    ] || DistributionType.Main;

  const environment =
    ENVIRONMENT_MAPPING[
      process.env.METAMASK_ENVIRONMENT as keyof typeof ENVIRONMENT_MAPPING
    ] || EnvironmentType.Development;

  return { distribution, environment };
}

/**
 * Initialize the remote feature flag controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @returns The initialized controller.
 */
export const RemoteFeatureFlagControllerInit: ControllerInitFunction<
  RemoteFeatureFlagController,
  RemoteFeatureFlagControllerMessenger,
  RemoteFeatureFlagControllerInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const preferencesState = initMessenger.call('PreferencesController:getState');
  const { distribution, environment } = getConfigForRemoteFeatureFlagRequest();

  const controller = new RemoteFeatureFlagController({
    messenger: controllerMessenger,
    fetchInterval: 15 * 60 * 1000, // 15 minutes in milliseconds
    disabled: !preferencesState.useExternalServices,
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

  initMessenger.subscribe(
    'PreferencesController:stateChange',
    previousValueComparator((prevState, currState) => {
      const { useExternalServices: prevUseExternalServices } = prevState;
      const { useExternalServices: currUseExternalServices } = currState;
      if (currUseExternalServices && !prevUseExternalServices) {
        controller.enable();
        controller.updateRemoteFeatureFlags().catch((error) => {
          console.error('Failed to update remote feature flags:', error);
        });
      } else if (!currUseExternalServices && prevUseExternalServices) {
        controller.disable();
      }

      return true;
    }, preferencesState),
  );

  return {
    controller,
  };
};
