import { connect } from 'react-redux'
import { compose } from 'recompose'
import ConfirmAddSuggestedToken from './confirm-add-suggested-token.component'
import { withRouter } from 'react-router-dom'
import { addToken, removeSuggestedTokens } from '../../store/actions'

const mapStateToProps = ({ metamask }) => {
  const { pendingTokens, suggestedTokens, tokens } = metamask
<<<<<<< HEAD
  const params = extend(pendingTokens, suggestedTokens)
=======
  const params = { ...pendingTokens, ...suggestedTokens }
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

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
