import AppMetadataController from '../controllers/app-metadata';
import { ControllerInitFunction } from './types';
import { AppMetadataControllerMessenger } from './messengers';

/**
 * Initialize the appMetadata controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @param request.currentMigrationVersion
 * @returns The initialized controller.
 */
export const AppMetadataControllerInit: ControllerInitFunction<
  AppMetadataController,
  AppMetadataControllerMessenger
> = ({ controllerMessenger, persistedState, currentMigrationVersion }) => {
  const controller = new AppMetadataController({
    state: persistedState.AppMetadataController,
    messenger: controllerMessenger,
    currentAppVersion: process.env.METAMASK_VERSION,
    currentMigrationVersion,
  });

  return {
    controller,
  };
};
