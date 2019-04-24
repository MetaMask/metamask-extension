const {
  getCurrentNetworkId,
  getSelectedAsset,
  getAccountType,
  getNumberOfAccounts,
  getNumberOfTokens,
} = require('../../../ui/app/selectors/selectors')
const {
  sendMetaMetricsEvent,
} = require('../../../ui/app/helpers/utils/metametrics.util')

const inDevelopment = process.env.NODE_ENV === 'development'

const METAMETRICS_TRACKING_URL = inDevelopment
  ? 'http://www.metamask.io/metametrics'
  : 'http://www.metamask.io/metametrics-prod'

async function backEndMetaMetricsEvent (getState, eventData) {
  const metamask = await getState()
  const state = { metamask }
  console.log('!!!!!!!!!!!!!!!! state', state)
  const stateEventData = {
    network: getCurrentNetworkId(state),
    activeCurrency: getSelectedAsset(state),
    accountType: getAccountType(state),
    metaMetricsId: state.metamask.metaMetricsId,
    numberOfTokens: getNumberOfTokens(state),
    numberOfAccounts: getNumberOfAccounts(state),
    participateInMetaMetrics: state.metamask.participateInMetaMetrics,
  }

  if (stateEventData.participateInMetaMetrics) {
      sendMetaMetricsEvent({
        ...stateEventData,
        ...eventData,
        url: METAMETRICS_TRACKING_URL + '/backend',
      })
  }
}

module.exports = backEndMetaMetricsEvent
