import { connect } from 'react-redux'
import FirstTimeFlowSwitch from './first-time-flow-switch.component'

const mapStateToProps = ({ metamask }) => {
  const { completedOnboarding, isInitialized } = metamask

  return {
    completedOnboarding,
    isInitialized,
  }
}

export default connect(mapStateToProps)(FirstTimeFlowSwitch)
