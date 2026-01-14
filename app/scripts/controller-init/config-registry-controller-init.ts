import { ConfigRegistryController } from '@metamask/config-registry-controller';
import { ControllerInitFunction } from './types';
import { ConfigRegistryControllerMessenger } from './messengers';

/**
 * Initialize the Config Registry controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const ConfigRegistryControllerInit: ControllerInitFunction<
  ConfigRegistryController,
  ConfigRegistryControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  if (!controllerMessenger) {
    throw new Error('ConfigRegistryController requires a controllerMessenger');
  }

  try {
    const controller = new ConfigRegistryController({
      messenger: controllerMessenger as any,
      state: persistedState.ConfigRegistryController,
    });

    return {
      controller,
    };
  } catch (error) {
    console.error('ConfigRegistryController initialization error:', error);
    throw error;
  }
};
