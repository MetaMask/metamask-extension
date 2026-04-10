/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { DataDeletionService } from './data-deletion-service';

/**
 * Submit a deletion request.
 *
 * We use Segment for this request. Segment calls this deletion request a "regulation", and
 * returns a "regulation ID" to keep track of this request and get status updates for it.
 * https://docs.segmentapis.com/tag/Deletion-and-Suppression#operation/createSourceRegulation
 *
 * @param metaMetricsId - The ID associated with the analytics data that we will be deleting.
 * @returns The regulation ID for the deletion request.
 */
export type DataDeletionServiceCreateDataDeletionRegulationTaskAction = {
  type: `DataDeletionService:createDataDeletionRegulationTask`;
  handler: DataDeletionService['createDataDeletionRegulationTask'];
};

/**
 * Fetch the status of the given deletion request.
 * https://docs.segmentapis.com/tag/Deletion-and-Suppression#operation/getRegulation
 *
 * @param deleteRegulationId - The Segment "regulation ID" for the deletion request to check.
 * @returns The status of the given deletion request.
 */
export type DataDeletionServiceFetchDeletionRegulationStatusAction = {
  type: `DataDeletionService:fetchDeletionRegulationStatus`;
  handler: DataDeletionService['fetchDeletionRegulationStatus'];
};

/**
 * Union of all DataDeletionService action types.
 */
export type DataDeletionServiceMethodActions =
  | DataDeletionServiceCreateDataDeletionRegulationTaskAction
  | DataDeletionServiceFetchDeletionRegulationStatusAction;
