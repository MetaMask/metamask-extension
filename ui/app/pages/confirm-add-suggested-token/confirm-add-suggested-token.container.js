import { connect } from 'react-redux'
import { compose } from 'recompose'
import ConfirmAddSuggestedToken from './confirm-add-suggested-token.component'
import { withRouter } from 'react-router-dom'

const extend = require('xtend')

const { addToken, removeSuggestedTokens } = require('../../store/actions')

const mapStateToProps = ({ metamask }) => {
  const { pendingTokens, suggestedTokens } = metamask
  const params = extend(pendingTokens, suggestedTokens)

  return {
    pendingTokens: params,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addToken: ({address, symbol, decimals, image}) => dispatch(addToken(address, symbol, Number(decimals), image)),
    removeSuggestedTokens: () => dispatch(removeSuggestedTokens()),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ConfirmAddSuggestedToken)
