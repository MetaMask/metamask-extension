import { connect } from 'react-redux'
import FirstTimeFlowSwitch from './first-time-flow-switch.component'

const mapStateToProps = ({ metamask }) => {
  const {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    participateInMetaMetrics: optInMetaMetrics,
  } = metamask

  return {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    optInMetaMetrics,
  }
}

export default connect(mapStateToProps)(FirstTimeFlowSwitch)
