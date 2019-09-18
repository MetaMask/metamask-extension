import { connect } from 'react-redux'
import MetaMetricsOptIn from './metametrics-opt-in.component'
import { setParticipateInMetaMetrics, setCompletedOnboarding } from '../../../store/actions'
import { getFirstTimeFlowTypeRoute } from '../first-time-flow.selectors'

const firstTimeFlowTypeNameMap = {
  create: 'Selected Create New Wallet',
  import: 'Selected Import Wallet',
  restore: 'Restored Vault',
}

const mapStateToProps = (state) => {
  const { firstTimeFlowType, participateInMetaMetrics } = state.metamask

  return {
    nextRoute: getFirstTimeFlowTypeRoute(state),
    firstTimeSelectionMetaMetricsName: firstTimeFlowTypeNameMap[firstTimeFlowType],
    participateInMetaMetrics,
    firstTimeFlowType,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    completeOnboarding: () => dispatch(setCompletedOnboarding()),
    setParticipateInMetaMetrics: (val) => dispatch(setParticipateInMetaMetrics(val)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MetaMetricsOptIn)
