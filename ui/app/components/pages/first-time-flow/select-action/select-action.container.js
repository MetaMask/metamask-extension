import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import { setFirstTimeFlowType } from '../../../../actions'
import Welcome from './select-action.component'

const mapDispatchToProps = dispatch => {
  return {
    setFirstTimeFlowType: type => dispatch(setFirstTimeFlowType(type)),
  }
}

export default compose(
  withRouter,
  connect(null, mapDispatchToProps)
)(Welcome)
