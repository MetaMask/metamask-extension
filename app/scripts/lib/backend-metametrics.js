import { getBackgroundMetaMetricState } from '../../../ui/app/selectors'
import { sendMetaMetricsEvent } from '../../../ui/app/helpers/utils/metametrics.util'

const inDevelopment = process.env.NODE_ENV === 'development'

const METAMETRICS_TRACKING_URL = inDevelopment
  ? 'http://www.metamask.io/metametrics'
  : 'http://www.metamask.io/metametrics-prod'

export default function backEndMetaMetricsEvent (metaMaskState, eventData) {
  const stateEventData = getBackgroundMetaMetricState({ metamask: metaMaskState })

  if (stateEventData.participateInMetaMetrics) {
    sendMetaMetricsEvent({
      ...stateEventData,
      ...eventData,
      url: METAMETRICS_TRACKING_URL + '/backend',
    })
  }
}
