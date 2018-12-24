import { connect } from 'react-redux'
import FirstTimeFlowSwitch from './first-time-flow-switch.component'

const mapStateToProps = ({ metamask }) => {
  const {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    noActiveNotices,
  } = metamask

  return {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    noActiveNotices,
  }
}

export default connect(mapStateToProps)(FirstTimeFlowSwitch)
