import MetaMetricsController from '../controllers/metametrics-controller';
import { segment } from '../lib/segment';
import { captureException } from '../../../shared/lib/sentry';
import { MetaMetricsControllerMessenger } from './messengers';
import { ControllerInitFunction } from './types';

/**
 * Initialize the MetaMetrics controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.extension
 * @returns The initialized controller.
 */
export const MetaMetricsControllerInit: ControllerInitFunction<
  MetaMetricsController,
  MetaMetricsControllerMessenger
> = ({ controllerMessenger, extension, persistedState }) => {
  const controller = new MetaMetricsController({
    state: persistedState.MetaMetricsController,
    messenger: controllerMessenger,
    version: process.env.METAMASK_VERSION as string,
    environment: process.env.METAMASK_ENVIRONMENT as string,
    segment,
    extension,
    captureException,
  });

  return {
    controller,
  };
};
