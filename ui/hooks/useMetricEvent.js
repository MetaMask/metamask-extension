import { useContext, useCallback } from 'react';
import { MetaMetricsContext } from '../contexts/metametrics';
import { MetaMetricsContext as NewMetaMetricsContext } from '../contexts/metametrics.new';
import { useEqualityCheck } from './useEqualityCheck';

// Type imports
/**
 * @typedef {import('../contexts/metametrics.new').UIMetricsEventPayload} UIMetricsEventPayload
 * @typedef {import('../../shared/constants/metametrics').MetaMetricsEventOptions} MetaMetricsEventOptions
 */

export function useMetricEvent(config = {}, overrides = {}) {
  const metricsEvent = useContext(MetaMetricsContext);
  const trackEvent = useCallback(() => metricsEvent(config, overrides), [
    config,
    metricsEvent,
    overrides,
  ]);
  return trackEvent;
}

/**
 * track a metametrics event using segment
 * e.g metricsEvent({ event: 'Unlocked MetaMask', category: 'Navigation' })
 *
 * @param {UIMetricsEventPayload}  payload - payload of the event to track
 * @param {MetaMetricsEventOptions} options - options for handling/routing event
 * @return {() => Promise<void>} function to execute the tracking event
 */
export function useNewMetricEvent(payload, options) {
  const memoizedPayload = useEqualityCheck(payload);
  const memoizedOptions = useEqualityCheck(options);
  const metricsEvent = useContext(NewMetaMetricsContext);

  return useCallback(() => metricsEvent(memoizedPayload, memoizedOptions), [
    metricsEvent,
    memoizedPayload,
    memoizedOptions,
  ]);
}
