import {
  ProfileMetricsController,
  ProfileMetricsControllerMessenger,
} from '@metamask/profile-metrics-controller';
import type { ControllerInitFunction } from './types';

const isTestEnvironment = Boolean(process.env.IN_TEST);

/**
 * Initialize the profile metrics controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @param request.getController - A function to get other initialized controllers.
 * @returns The initialized controller.
 */
export const ProfileMetricsControllerInit: ControllerInitFunction<
  ProfileMetricsController,
  ProfileMetricsControllerMessenger
> = ({ controllerMessenger, persistedState, getController }) => {
  const remoteFeatureFlagController = getController(
    'RemoteFeatureFlagController',
  );
  const metaMetricsController = getController('MetaMetricsController');
  const assertUserOptedIn = () =>
    remoteFeatureFlagController.state.remoteFeatureFlags.extensionUxPna25 ===
      true && metaMetricsController.state.participateInMetaMetrics === true;

  const controller = new ProfileMetricsController({
    messenger: controllerMessenger,
    state: persistedState.ProfileMetricsController,
    interval: isTestEnvironment ? 1000 : 10 * 1000,
    assertUserOptedIn,
    getMetaMetricsId: () => metaMetricsController.getMetaMetricsId(),
  });

  return {
    controller,
  };
};
