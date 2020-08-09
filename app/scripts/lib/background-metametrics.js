import { getBackgroundMetaMetricState } from '../../../ui/app/selectors'
import { sendMetaMetricsEvent } from '../../../ui/app/helpers/utils/metametrics.util'

export default function backgroundMetaMetricsEvent (metaMaskState, eventData) {

  eventData.eventOpts['category'] = 'Background'

  const stateEventData = getBackgroundMetaMetricState({ metamask: metaMaskState })
  if (stateEventData.participateInMetaMetrics) {
    sendMetaMetricsEvent({
      ...stateEventData,
      ...eventData,
      currentPath: '/background',
    })
  }
}
