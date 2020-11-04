import { connect } from 'react-redux'
import FirstTimeFlowSwitch from './first-time-flow-switch.component'

const mapStateToProps = ({ metamask }) => {
  const { completedOnboarding, isInitialized, isUnlocked } = metamask

  return {
    completedOnboarding,
    isInitialized,
    isUnlocked,
  }
}

export default connect(mapStateToProps)(FirstTimeFlowSwitch)
