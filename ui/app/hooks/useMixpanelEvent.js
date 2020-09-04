import { useContext, useCallback } from 'react'
import { MixPanelContext } from '../contexts/metametrics'

export function useMixPanelEvent (eventName, data) {
  const mixPanelEvent = useContext(MixPanelContext)
  const trackEvent = useCallback(() => mixPanelEvent(eventName, data), [eventName, data, mixPanelEvent])
  return trackEvent
}
