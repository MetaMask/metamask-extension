import { connect } from 'react-redux'
import EndOfFlow from './end-of-flow.component'
import { setCompletedOnboarding } from '../../../store/actions'

const firstTimeFlowTypeNameMap = {
  create: 'New Wallet Created',
  'import': 'New Wallet Imported',
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
