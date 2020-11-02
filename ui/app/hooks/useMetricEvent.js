import { useContext, useCallback } from 'react'
import { MetaMetricsContext } from '../contexts/metametrics'
import { MetaMetricsContext as NewMetaMetricsContext } from '../contexts/metametrics.new'
import { useEqualityCheck } from './useEqualityCheck'

export function useMetricEvent(config = {}, overrides = {}) {
  const metricsEvent = useContext(MetaMetricsContext)
  const trackEvent = useCallback(() => metricsEvent(config, overrides), [
    config,
    metricsEvent,
    overrides,
  ])
  return trackEvent
}

/**
 * track a metametrics event using segment
 * e.g metricsEvent({ event: 'Unlocked MetaMask', category: 'Navigation' })
 *
 * @param {object}  config - configuration object for the event to track
 * @param {string}  config.event - event name to track
 * @param {string}  config.category - category to associate event to
 * @param {boolean} [config.isOptIn] - happened during opt in/out workflow
 * @param {object}  [config.properties] - object of custom values to track, snake_case
 * @param {number}  [config.revenue] - amount of currency that event creates in revenue for MetaMask
 * @param {string}  [config.currency] - ISO 4127 format currency for events with revenue, defaults to US dollars
 * @param {number}  [config.value] - Abstract "value" that this event has for MetaMask.
 * @return {() => undefined} function to execute the tracking event
 */
export function useNewMetricEvent(config) {
  const memoizedConfig = useEqualityCheck(config)
  const metricsEvent = useContext(NewMetaMetricsContext)
  return useCallback(() => metricsEvent(memoizedConfig), [
    metricsEvent,
    memoizedConfig,
  ])
}
