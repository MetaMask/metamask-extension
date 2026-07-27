/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { MetaMetricsController } from './metametrics-controller';

export type MetaMetricsControllerFinalizeAbandonedFragmentsAction = {
  type: `MetaMetricsController:finalizeAbandonedFragments`;
  handler: MetaMetricsController['finalizeAbandonedFragments'];
};

/**
 * Create an event fragment in state and returns the event fragment object.
 *
 * @param options - Fragment settings and properties to initiate the fragment with.
 */
export type MetaMetricsControllerCreateEventFragmentAction = {
  type: `MetaMetricsController:createEventFragment`;
  handler: MetaMetricsController['createEventFragment'];
};

/**
 * Returns the fragment stored in memory with provided id or undefined if it
 * does not exist.
 *
 * @param id - id of fragment to retrieve
 */
export type MetaMetricsControllerGetEventFragmentByIdAction = {
  type: `MetaMetricsController:getEventFragmentById`;
  handler: MetaMetricsController['getEventFragmentById'];
};

/**
 * Deletes to finalizes event fragment based on the canDeleteIfAbandoned property.
 *
 * @param fragment
 */
export type MetaMetricsControllerProcessAbandonedFragmentAction = {
  type: `MetaMetricsController:processAbandonedFragment`;
  handler: MetaMetricsController['processAbandonedFragment'];
};

/**
 * Updates an event fragment in state
 *
 * @param id - The fragment id to update
 * @param payload - Fragment settings and properties to initiate the fragment with.
 */
export type MetaMetricsControllerUpdateEventFragmentAction = {
  type: `MetaMetricsController:updateEventFragment`;
  handler: MetaMetricsController['updateEventFragment'];
};

/**
 * Deletes an event fragment from state
 *
 * @param id - The fragment id to delete
 */
export type MetaMetricsControllerDeleteEventFragmentAction = {
  type: `MetaMetricsController:deleteEventFragment`;
  handler: MetaMetricsController['deleteEventFragment'];
};

/**
 * Finalizes a fragment, tracking either a success event or failure Event
 * and then removes the fragment from state.
 *
 * @param id - UUID of the event fragment to be closed
 * @param options
 * @param options.abandoned - if true track the failure event instead of the success event
 * @param options.page - page the final event occurred on. This will override whatever is set on the fragment
 * @param options.referrer - Dapp that originated the fragment. This is for fallback only, the fragment referrer
 * property will take precedence.
 */
export type MetaMetricsControllerFinalizeEventFragmentAction = {
  type: `MetaMetricsController:finalizeEventFragment`;
  handler: MetaMetricsController['finalizeEventFragment'];
};

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

export type MetaMetricsControllerHandleMetaMaskStateUpdateAction = {
  type: `MetaMetricsController:handleMetaMaskStateUpdate`;
  handler: MetaMetricsController['handleMetaMaskStateUpdate'];
};

export type MetaMetricsControllerTrackEventsAfterMetricsOptInAction = {
  type: `MetaMetricsController:trackEventsAfterMetricsOptIn`;
  handler: MetaMetricsController['trackEventsAfterMetricsOptIn'];
};

export type MetaMetricsControllerClearEventsAfterMetricsOptInAction = {
  type: `MetaMetricsController:clearEventsAfterMetricsOptIn`;
  handler: MetaMetricsController['clearEventsAfterMetricsOptIn'];
};

export type MetaMetricsControllerAddEventBeforeMetricsOptInAction = {
  type: `MetaMetricsController:addEventBeforeMetricsOptIn`;
  handler: MetaMetricsController['addEventBeforeMetricsOptIn'];
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
  | MetaMetricsControllerFinalizeAbandonedFragmentsAction
  | MetaMetricsControllerCreateEventFragmentAction
  | MetaMetricsControllerGetEventFragmentByIdAction
  | MetaMetricsControllerProcessAbandonedFragmentAction
  | MetaMetricsControllerUpdateEventFragmentAction
  | MetaMetricsControllerDeleteEventFragmentAction
  | MetaMetricsControllerFinalizeEventFragmentAction
  | MetaMetricsControllerUpdateExtensionUninstallUrlAction
  | MetaMetricsControllerSetParticipateInMetaMetricsAction
  | MetaMetricsControllerSetDataCollectionForMarketingAction
  | MetaMetricsControllerSetMarketingCampaignCookieIdAction
  | MetaMetricsControllerHandleMetaMaskStateUpdateAction
  | MetaMetricsControllerTrackEventsAfterMetricsOptInAction
  | MetaMetricsControllerClearEventsAfterMetricsOptInAction
  | MetaMetricsControllerAddEventBeforeMetricsOptInAction
  | MetaMetricsControllerTrackTracesAfterMetricsOptInAction
  | MetaMetricsControllerClearTracesAfterMetricsOptInAction
  | MetaMetricsControllerAddTraceBeforeMetricsOptInAction
  | MetaMetricsControllerBufferedTraceAction
  | MetaMetricsControllerBufferedEndTraceAction
  | MetaMetricsControllerUpdateTraitsAction;
