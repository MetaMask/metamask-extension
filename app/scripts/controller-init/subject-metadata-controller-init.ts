import { SubjectMetadataController } from '@metamask/permission-controller';
import { SubjectMetadataControllerMessenger } from './messengers';
import { ControllerInitFunction } from './types';

/**
 * Initialize the subject metadata controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const SubjectMetadataControllerInit: ControllerInitFunction<
  SubjectMetadataController,
  SubjectMetadataControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new SubjectMetadataController({
    state: persistedState.SubjectMetadataController,
    messenger: controllerMessenger,
    subjectCacheLimit: 100,
  });

  return {
    controller,
  };
};
