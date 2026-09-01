/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { MetaMetricsDataDeletionController } from './metametrics-data-deletion';

/**
 * Creating the delete regulation using source regulation
 *
 */
export type MetaMetricsDataDeletionControllerCreateMetaMetricsDataDeletionTaskAction =
  {
    type: `MetaMetricsDataDeletionController:createMetaMetricsDataDeletionTask`;
    handler: MetaMetricsDataDeletionController['createMetaMetricsDataDeletionTask'];
  };

/**
 * To check the status of the current delete regulation.
 */
export type MetaMetricsDataDeletionControllerUpdateDataDeletionTaskStatusAction =
  {
    type: `MetaMetricsDataDeletionController:updateDataDeletionTaskStatus`;
    handler: MetaMetricsDataDeletionController['updateDataDeletionTaskStatus'];
  };

/**
 * Union of all MetaMetricsDataDeletionController action types.
 */
export type MetaMetricsDataDeletionControllerMethodActions =
  | MetaMetricsDataDeletionControllerCreateMetaMetricsDataDeletionTaskAction
  | MetaMetricsDataDeletionControllerUpdateDataDeletionTaskStatusAction;
