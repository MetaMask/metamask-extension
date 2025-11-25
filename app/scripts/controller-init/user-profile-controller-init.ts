import {
  UserProfileController,
  UserProfileControllerMessenger,
} from '@metamask/user-profile-controller';
import type { ControllerInitFunction } from './types';

/**
 * Initialize the user profile controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @param request.getController - A function to get other initialized controllers.
 * @returns The initialized controller.
 */
export const UserProfileControllerInit: ControllerInitFunction<
  UserProfileController,
  UserProfileControllerMessenger
> = ({ controllerMessenger, persistedState, getController }) => {
  const remoteFeatureFlagController = getController(
    'RemoteFeatureFlagController',
  );
  const metaMetricsController = getController('MetaMetricsController');
  const assertUserOptedIn = () =>
    remoteFeatureFlagController.state.remoteFeatureFlags.extensionUxPna25 ===
      true && metaMetricsController.state.participateInMetaMetrics === true;

  const controller = new UserProfileController({
    messenger: controllerMessenger,
    state: persistedState.UserProfileController,
    assertUserOptedIn,
    getMetaMetricsId: () => metaMetricsController.getMetaMetricsId(),
  });

  return {
    controller,
  };
};
