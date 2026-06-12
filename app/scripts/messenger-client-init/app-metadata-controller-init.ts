import {
  AppMetadataController,
  AppMetadataControllerMessenger,
} from '../controllers/app-metadata';
import { MessengerClientInitFunction } from './types';

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
export const AppMetadataControllerInit: MessengerClientInitFunction<
  AppMetadataController,
  AppMetadataControllerMessenger
> = ({ controllerMessenger, persistedState, currentMigrationVersion }) => {
  const messengerClient = new AppMetadataController({
    state: persistedState.AppMetadataController,
    messenger: controllerMessenger,
    currentAppVersion: process.env.METAMASK_VERSION,
    currentMigrationVersion,
  });

  return {
    messengerClient,
  };
};
