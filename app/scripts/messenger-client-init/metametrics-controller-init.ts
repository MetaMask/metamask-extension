import {
  MetaMetricsController,
  MetaMetricsControllerMessenger,
} from '../controllers/metametrics-controller';
import { segment } from '../lib/segment';
import { captureException } from '../../../shared/lib/sentry';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the MetaMetrics controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.extension
 * @returns The initialized controller.
 */
export const MetaMetricsControllerInit: MessengerClientInitFunction<
  MetaMetricsController,
  MetaMetricsControllerMessenger
> = ({ controllerMessenger, extension, persistedState }) => {
  const messengerClient = new MetaMetricsController({
    state: persistedState.MetaMetricsController,
    messenger: controllerMessenger,
    version: process.env.METAMASK_VERSION as string,
    environment: process.env.METAMASK_ENVIRONMENT as string,
    segment,
    extension,
    captureException,
  });

  return {
    messengerClient,
  };
};
