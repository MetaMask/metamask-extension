import { connect } from 'react-redux'
import ConfirmAddToken from './confirm-add-token.component'

const { addTokens, clearPendingTokens, goHome, showAddTokenPage } = require('../../../../ui/app/actions')

const mapStateToProps = ({ metamask }) => {
  const { pendingTokens, network } = metamask
  return {
    pendingTokens,
    network,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addTokens: tokens => dispatch(addTokens(tokens)),
    clearPendingTokens: () => dispatch(clearPendingTokens()),
    goHome: () => dispatch(goHome()),
    showAddTokenPage: () => dispatch(showAddTokenPage()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmAddToken)
