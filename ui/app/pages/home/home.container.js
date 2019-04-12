import Home from './home.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { unconfirmedTransactionsCountSelector } from '../../selectors/confirm-transaction'
import { getCurrentEthBalance } from '../../selectors/selectors'
import {
  unsetMigratedPrivacyMode,
} from '../../store/actions'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../app/scripts/lib/enums'

const mapStateToProps = state => {
  const { metamask, appState } = state
  const {
    suggestedTokens,
    providerRequests,
    migratedPrivacyMode,
    seedPhraseBackedUp,
    tokens,
    permissionsRequests,
  } = metamask
  const accountBalance = getCurrentEthBalance(state)
  const { forgottenPassword } = appState

  const isPopup = getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP

  return {
    forgottenPassword,
    suggestedTokens,
    unconfirmedTransactionsCount: unconfirmedTransactionsCountSelector(state),
    providerRequests,
    showPrivacyModeNotification: migratedPrivacyMode,
    shouldShowSeedPhraseReminder: !seedPhraseBackedUp && (parseInt(accountBalance, 16) > 0 || tokens.length > 0),
    isPopup,
    permissionsRequests,
  }
}

const mapDispatchToProps = (dispatch) => ({
  unsetMigratedPrivacyMode: () => dispatch(unsetMigratedPrivacyMode()),
})

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Home)
