import {
  MetaMetricsDataDeletionController,
  MetaMetricsDataDeletionControllerMessenger,
} from '../controllers/metametrics-data-deletion/metametrics-data-deletion';
import type { DataDeletionService } from '../services/data-deletion-service';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the MetaMetrics data deletion controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @param request.getMessengerClient - The function to get other messenger clients.
 * @returns The initialized controller.
 */
export const MetaMetricsDataDeletionControllerInit: MessengerClientInitFunction<
  MetaMetricsDataDeletionController,
  MetaMetricsDataDeletionControllerMessenger
> = ({ controllerMessenger, persistedState, getMessengerClient }) => {
  const dataDeletionService = getMessengerClient(
    'DataDeletionService',
  ) as DataDeletionService;

  const messengerClient = new MetaMetricsDataDeletionController({
    messenger: controllerMessenger,
    state: persistedState.MetaMetricsDataDeletionController,
    dataDeletionService,
  });

  return {
    messengerClient,
  };
};
