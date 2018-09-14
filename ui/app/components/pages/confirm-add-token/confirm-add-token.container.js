import { connect } from 'react-redux'
import ConfirmAddToken from './confirm-add-token.component'

const { addTokens, clearPendingTokens, goHome } = require('../../../actions')

const mapStateToProps = ({ metamask }) => {
  const { pendingTokens } = metamask
  return {
    pendingTokens,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addTokens: tokens => dispatch(addTokens(tokens)),
    clearPendingTokens: () => dispatch(clearPendingTokens()),
    goHome: () => dispatch(goHome()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmAddToken)
