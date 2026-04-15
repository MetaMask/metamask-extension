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
 * @param request.getController - The function to get other controllers.
 * @returns The initialized controller.
 */
export const MetaMetricsDataDeletionControllerInit: MessengerClientInitFunction<
  MetaMetricsDataDeletionController,
  MetaMetricsDataDeletionControllerMessenger
> = ({ controllerMessenger, persistedState, getController }) => {
  const dataDeletionService = getController(
    'DataDeletionService',
  ) as DataDeletionService;

  const controller = new MetaMetricsDataDeletionController({
    messenger: controllerMessenger,
    state: persistedState.MetaMetricsDataDeletionController,
    dataDeletionService,
  });

  return {
    controller,
  };
};
