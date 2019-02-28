import { connect } from 'react-redux'
import EndOfFlow from './end-of-flow.component'
import { setCompletedOnboarding } from '../../../../actions'

const firstTimeFlowTypeNameMap = {
  create: 'Selected Create New Wallet',
  'import': 'Selected Import Wallet',
}

const mapStateToProps = ({ metamask }) => {
  const { firstTimeFlowType } = metamask

  return {
    completionMetaMetricsName: firstTimeFlowTypeNameMap[firstTimeFlowType],
  }
}


const mapDispatchToProps = dispatch => {
  return {
    completeOnboarding: () => dispatch(setCompletedOnboarding()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EndOfFlow)
