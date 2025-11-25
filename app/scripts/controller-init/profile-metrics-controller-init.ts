import {
  ProfileMetricsController,
  ProfileMetricsControllerMessenger,
} from '@metamask/profile-metrics-controller';
import type { ControllerInitFunction } from './types';

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
    assertUserOptedIn,
    getMetaMetricsId: () => metaMetricsController.getMetaMetricsId(),
  });

  return {
    controller,
  };
};
