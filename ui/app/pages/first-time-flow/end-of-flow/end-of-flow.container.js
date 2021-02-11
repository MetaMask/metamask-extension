import { connect } from 'react-redux'
import EndOfFlow from './end-of-flow.component'
import { getOnboardingInitiator } from '../../../selectors'

const firstTimeFlowTypeNameMap = {
  create: 'New Wallet Created',
  'import': 'New Wallet Imported',
}

const mapStateToProps = (state) => {
  const { metamask: { firstTimeFlowType } } = state

  return {
    completionMetaMetricsName: firstTimeFlowTypeNameMap[firstTimeFlowType],
    onboardingInitiator: getOnboardingInitiator(state),
  }
}

export default connect(mapStateToProps)(EndOfFlow)
