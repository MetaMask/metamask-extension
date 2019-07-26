import NotificationHome from './notification-redirect.component'
import { connect } from 'react-redux'
import { unconfirmedTransactionsCountSelector } from '../../selectors/confirm-transaction'

const mapStateToProps = state => {
  const { metamask, appState } = state
  const {
    suggestedTokens,
    providerRequests,
  } = metamask
  const { forgottenPassword } = appState

  return {
    forgottenPassword,
    providerRequests,
    suggestedTokens,
    unconfirmedTransactionsCount: unconfirmedTransactionsCountSelector(state),
  }
}

export default connect(mapStateToProps)(NotificationHome)
