/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { MetaMetricsController } from './metametrics-controller';

export type MetaMetricsControllerUpdateExtensionUninstallUrlAction = {
  type: `MetaMetricsController:updateExtensionUninstallUrl`;
  handler: MetaMetricsController['updateExtensionUninstallUrl'];
};

/**
 * Setter for the `participateInMetaMetrics` property
 *
 * @param participateInMetaMetrics - Whether or not the user wants to participate in MetaMetrics if not set
 * @returns The string of the new metametrics id, or null
 */
export type MetaMetricsControllerSetParticipateInMetaMetricsAction = {
  type: `MetaMetricsController:setParticipateInMetaMetrics`;
  handler: MetaMetricsController['setParticipateInMetaMetrics'];
};

export type MetaMetricsControllerSetDataCollectionForMarketingAction = {
  type: `MetaMetricsController:setDataCollectionForMarketing`;
  handler: MetaMetricsController['setDataCollectionForMarketing'];
};

export type MetaMetricsControllerSetMarketingCampaignCookieIdAction = {
  type: `MetaMetricsController:setMarketingCampaignCookieId`;
  handler: MetaMetricsController['setMarketingCampaignCookieId'];
};

export type MetaMetricsControllerTrackTracesAfterMetricsOptInAction = {
  type: `MetaMetricsController:trackTracesAfterMetricsOptIn`;
  handler: MetaMetricsController['trackTracesAfterMetricsOptIn'];
};

export type MetaMetricsControllerClearTracesAfterMetricsOptInAction = {
  type: `MetaMetricsController:clearTracesAfterMetricsOptIn`;
  handler: MetaMetricsController['clearTracesAfterMetricsOptIn'];
};

export type MetaMetricsControllerAddTraceBeforeMetricsOptInAction = {
  type: `MetaMetricsController:addTraceBeforeMetricsOptIn`;
  handler: MetaMetricsController['addTraceBeforeMetricsOptIn'];
};

/**
 * Buffered trace method that checks consent and either buffers or executes immediately
 *
 * @param request - The trace request
 * @param fn - Optional callback function to trace
 * @returns The result of the trace callback or undefined if buffered
 */
export type MetaMetricsControllerBufferedTraceAction = {
  type: `MetaMetricsController:bufferedTrace`;
  handler: MetaMetricsController['bufferedTrace'];
};

/**
 * Buffered end trace method that checks consent and either buffers or executes immediately
 *
 * @param request - The end trace request
 */
export type MetaMetricsControllerBufferedEndTraceAction = {
  type: `MetaMetricsController:bufferedEndTrace`;
  handler: MetaMetricsController['bufferedEndTrace'];
};

export type MetaMetricsControllerUpdateTraitsAction = {
  type: `MetaMetricsController:updateTraits`;
  handler: MetaMetricsController['updateTraits'];
};

/**
 * Union of all MetaMetricsController action types.
 */
export type MetaMetricsControllerMethodActions =
  | MetaMetricsControllerUpdateExtensionUninstallUrlAction
  | MetaMetricsControllerSetParticipateInMetaMetricsAction
  | MetaMetricsControllerSetDataCollectionForMarketingAction
  | MetaMetricsControllerSetMarketingCampaignCookieIdAction
  | MetaMetricsControllerTrackTracesAfterMetricsOptInAction
  | MetaMetricsControllerClearTracesAfterMetricsOptInAction
  | MetaMetricsControllerAddTraceBeforeMetricsOptInAction
  | MetaMetricsControllerBufferedTraceAction
  | MetaMetricsControllerBufferedEndTraceAction
  | MetaMetricsControllerUpdateTraitsAction;
