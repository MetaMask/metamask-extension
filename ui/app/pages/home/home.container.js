import Home from './home.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { unconfirmedTransactionsCountSelector } from '../../selectors/confirm-transaction'
import { onlyUnconfIsThreeBox } from '../../selectors/selectors'

const mapStateToProps = state => {
  const { metamask, appState } = state
  const {
    lostAccounts,
    seedWords,
    suggestedTokens,
    providerRequests,
  } = metamask
  const { forgottenPassword } = appState

  return {
    lostAccounts,
    forgottenPassword,
    seedWords,
    suggestedTokens,
    unconfirmedTransactionsCount: unconfirmedTransactionsCountSelector(state),
    providerRequests,
    onlyUnconfIsThreeBox: onlyUnconfIsThreeBox(state),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(Home)
