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

<<<<<<< HEAD

const mapDispatchToProps = dispatch => {
=======
const mapDispatchToProps = (dispatch) => {
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
  return {
    completeOnboarding: () => dispatch(setCompletedOnboarding()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EndOfFlow)
