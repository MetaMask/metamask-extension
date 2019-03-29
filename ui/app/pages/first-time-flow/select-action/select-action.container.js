import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import { setFirstTimeFlowType } from '../../../store/actions'
import { getFirstTimeFlowTypeRoute } from '../first-time-flow.selectors'
import Welcome from './select-action.component'

const mapStateToProps = (state) => {
  return {
    nextRoute: getFirstTimeFlowTypeRoute(state),
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setFirstTimeFlowType: type => dispatch(setFirstTimeFlowType(type)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Welcome)
