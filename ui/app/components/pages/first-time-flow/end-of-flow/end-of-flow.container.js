import { connect } from 'react-redux'
import EndOfFlow from './end-of-flow.component'
import { setCompletedOnboarding } from '../../../../actions'

const mapDispatchToProps = dispatch => {
  return {
    completeOnboarding: () => dispatch(setCompletedOnboarding()),
  }
}

export default connect(null, mapDispatchToProps)(EndOfFlow)
