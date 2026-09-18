import {
  MetaMetricsController,
  MetaMetricsControllerMessenger,
} from '../controllers/metametrics-controller';
import { captureException } from '../../../shared/lib/sentry';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the MetaMetrics controller.
 *
 * Tracking is delegated to {@link AnalyticsController} via the messenger.
 * The Segment SDK is owned by the analytics platform adapter, not by this
 * controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MetaMetricsControllerInit: MessengerClientInitFunction<
  MetaMetricsController,
  MetaMetricsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new MetaMetricsController({
    state: persistedState.MetaMetricsController,
    messenger: controllerMessenger,
    captureException,
  });

  return {
    messengerClient,
  };
};
