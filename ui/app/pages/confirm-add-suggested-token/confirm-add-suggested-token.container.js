import { connect } from 'react-redux'
import { compose } from 'redux'
import ConfirmAddSuggestedToken from './confirm-add-suggested-token.component'
import { withRouter } from 'react-router-dom'
import { addToken, removeSuggestedTokens } from '../../store/actions'
import { getMostRecentOverviewPage } from '../../ducks/history/history'

const mapStateToProps = (state) => {
  const { metamask: { pendingTokens, suggestedTokens, tokens } } = state
  const params = { ...pendingTokens, ...suggestedTokens }

  return {
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
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
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmAddSuggestedToken)
