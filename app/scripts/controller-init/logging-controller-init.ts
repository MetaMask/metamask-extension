import { LoggingController, LogType } from '@metamask/logging-controller';
import { LOG_EVENT } from '../../../shared/constants/logs';
import { ControllerInitFunction } from './types';
import { LoggingControllerMessenger } from './messengers';

/**
 * Initialize the logging controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @param request.extension
 * @returns The initialized controller.
 */
export const LoggingControllerInit: ControllerInitFunction<
  LoggingController,
  LoggingControllerMessenger
> = ({ controllerMessenger, persistedState, extension }) => {
  const controller = new LoggingController({
    messenger: controllerMessenger,
    state: persistedState.LoggingController,
  });

  extension.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update') {
      controller.add({
        type: LogType.GenericLog,
        data: {
          event: LOG_EVENT.VERSION_UPDATE,
          previousVersion: details.previousVersion,
          version: process.env.METAMASK_VERSION,
        },
      });
    }
  });

  return {
    controller,
  };
};
