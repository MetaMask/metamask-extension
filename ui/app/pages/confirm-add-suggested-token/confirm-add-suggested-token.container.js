import { connect } from 'react-redux'
import { compose } from 'redux'
import ConfirmAddSuggestedToken from './confirm-add-suggested-token.component'
import { withRouter } from 'react-router-dom'
import { addToken, removeSuggestedTokens } from '../../store/actions'

const mapStateToProps = ({ metamask }) => {
  const { pendingTokens, suggestedTokens, tokens } = metamask
  const params = { ...pendingTokens, ...suggestedTokens }

  return {
    pendingTokens: params,
    tokens,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    addToken: ({ address, symbol, decimals, image }) => dispatch(addToken(address, symbol, Number(decimals), image)),
    removeSuggestedTokens: () => dispatch(removeSuggestedTokens()),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ConfirmAddSuggestedToken)
