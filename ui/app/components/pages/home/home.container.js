import Home from './home.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { unconfirmedTransactionsCountSelector } from '../../../selectors/confirm-transaction'

const mapStateToProps = state => {
  const { metamask, appState } = state
  const {
    noActiveNotices,
    lostAccounts,
    seedWords,
    suggestedTokens,
    permissionsRequests,
  } = metamask
  const { forgottenPassword } = appState

  return {
    noActiveNotices,
    lostAccounts,
    forgottenPassword,
    seedWords,
    suggestedTokens,
    unconfirmedTransactionsCount: unconfirmedTransactionsCountSelector(state),
    permissionsRequests,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(Home)
