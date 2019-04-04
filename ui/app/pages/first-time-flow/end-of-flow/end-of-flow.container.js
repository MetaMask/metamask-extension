import { connect } from 'react-redux'
import EndOfFlow from './end-of-flow.component'
import { setCompletedOnboarding,setthreebox } from '../../../store/actions'

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
    setthreebox: () =>dispatch(setthreebox())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EndOfFlow)
