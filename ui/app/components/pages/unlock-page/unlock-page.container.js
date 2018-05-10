import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'

const {
  tryUnlockMetamask,
  forgotPassword,
  markPasswordForgotten,
  setNetworkEndpoints,
} = require('../../../actions')

import UnlockPage from './unlock-page.component'

const mapStateToProps = state => {
  const { metamask: { isUnlocked } } = state
  return {
    isUnlocked,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    forgotPassword: () => dispatch(forgotPassword()),
    tryUnlockMetamask: password => dispatch(tryUnlockMetamask(password)),
    markPasswordForgotten: () => dispatch(markPasswordForgotten()),
    setNetworkEndpoints: type => dispatch(setNetworkEndpoints(type)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(UnlockPage)
