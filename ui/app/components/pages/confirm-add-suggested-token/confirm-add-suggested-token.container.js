import { connect } from 'react-redux'
import ConfirmAddSuggestedToken from './confirm-add-suggested-token.component'

const extend = require('xtend')

const { addTokens, clearPendingTokens, removeSuggestedTokens } = require('../../../actions')

const mapStateToProps = ({ metamask }) => {
  const { pendingTokens, suggestedTokens } = metamask
  const params = extend(pendingTokens, suggestedTokens)

  return {
    pendingTokens: params,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addTokens: tokens => dispatch(addTokens(tokens)),
    clearPendingTokens: () => dispatch(clearPendingTokens()),
    removeSuggestedTokens: () => dispatch(removeSuggestedTokens()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmAddSuggestedToken)
