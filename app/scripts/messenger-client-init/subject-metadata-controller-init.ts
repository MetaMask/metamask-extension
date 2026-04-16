import { SubjectMetadataController } from '@metamask/permission-controller';
import { SubjectMetadataControllerMessenger } from './messengers';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the subject metadata controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const SubjectMetadataControllerInit: MessengerClientInitFunction<
  SubjectMetadataController,
  SubjectMetadataControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new SubjectMetadataController({
    state: persistedState.SubjectMetadataController,
    messenger: controllerMessenger,
    subjectCacheLimit: 100,
  });

  return {
    messengerClient,
  };
};
