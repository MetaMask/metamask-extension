import SecurityTab from './security-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  setFeatureFlag,
  setParticipateInMetaMetrics,
} from '../../../store/actions'

const mapStateToProps = (state) => {
  const { appState: { warning }, metamask } = state
  const {
    featureFlags: {
      showIncomingTransactions,
    } = {},
    participateInMetaMetrics,
  } = metamask

  return {
    warning,
    showIncomingTransactions,
    participateInMetaMetrics,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setParticipateInMetaMetrics: (val) => dispatch(setParticipateInMetaMetrics(val)),
    setShowIncomingTransactionsFeatureFlag: (shouldShow) => dispatch(setFeatureFlag('showIncomingTransactions', shouldShow)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(SecurityTab)
