import { useContext, useCallback } from 'react'
import { MetaMetricsContext } from '../contexts/metametrics'


export function useMetricEvent (config = {}, overrides = {}) {
  const metricsEvent = useContext(MetaMetricsContext)
  const trackEvent = useCallback(() => metricsEvent(config, overrides), [config, overrides])
  return trackEvent
}
