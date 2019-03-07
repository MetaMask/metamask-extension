import SecurityTab from './security-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  displayWarning,
  revealSeedConfirmation,
  setFeatureFlag,
  showModal,
  setParticipateInMetaMetrics,
} from '../../../../actions'

const mapStateToProps = state => {
  const { appState: { warning }, metamask } = state
  const {
    featureFlags: {
      privacyMode,
      mobileSync,
    } = {},
    participateInMetaMetrics,
  } = metamask

  return {
    warning,
    privacyMode,
    mobileSync,
    participateInMetaMetrics,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    displayWarning: warning => dispatch(displayWarning(warning)),
    revealSeedConfirmation: () => dispatch(revealSeedConfirmation()),
    setPrivacyMode: enabled => dispatch(setFeatureFlag('privacyMode', enabled)),
    showClearApprovalModal: () => dispatch(showModal({ name: 'CLEAR_APPROVED_ORIGINS' })),
    setParticipateInMetaMetrics: (val) => dispatch(setParticipateInMetaMetrics(val)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(SecurityTab)
