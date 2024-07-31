import {
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
  MetaMetricsPageOptions,
  MetaMetricsPagePayload,
} from '../../shared/constants/metametrics';
import {
  generateActionId,
  submitRequestToBackground,
} from './background-connection';

/**
 * @param payload - details of the page viewed
 * @param options - options for handling the page view
 */
export function trackMetaMetricsPage(
  payload: MetaMetricsPagePayload,
  options: MetaMetricsPageOptions,
) {
  return submitRequestToBackground('trackMetaMetricsPage', [
    { ...payload, actionId: generateActionId() },
    options,
  ]);
}

/**
 * @param payload - details of the event to track
 * @param options - options for routing/handling of event
 * @returns
 */
export function trackMetaMetricsEvent(
  payload: MetaMetricsEventPayload,
  options?: MetaMetricsEventOptions,
) {
  return submitRequestToBackground('trackMetaMetricsEvent', [
    { ...payload, actionId: generateActionId() },
    options,
  ]);
}
