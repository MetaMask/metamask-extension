import { MetaMetricsDataDeletionController } from '../controllers/metametrics-data-deletion/metametrics-data-deletion';
import { DataDeletionService } from '../services/data-deletion-service';
import { ControllerInitFunction } from './types';
import { MetaMetricsDataDeletionControllerMessenger } from './messengers';

/**
 * Initialize the MetaMetrics data deletion controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @returns The initialized controller.
 */
export const MetaMetricsDataDeletionControllerInit: ControllerInitFunction<
  MetaMetricsDataDeletionController,
  MetaMetricsDataDeletionControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const dataDeletionService = new DataDeletionService();
  const controller = new MetaMetricsDataDeletionController({
    messenger: controllerMessenger,
    state: persistedState.MetaMetricsDataDeletionController,
    dataDeletionService,
  });

  return {
    controller,
  };
};
