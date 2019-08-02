import Home from './home.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { unconfirmedTransactionsCountSelector } from '../../selectors/confirm-transaction'
import { getCurrentEthBalance } from '../../selectors/selectors'
import {
  unsetMigratedPrivacyMode,
  showModal,
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
  } = metamask
  const accountBalance = getCurrentEthBalance(state)
  const { forgottenPassword, show3BoxModalAfterImport } = appState

  const isPopup = getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP

  return {
    forgottenPassword,
    suggestedTokens,
    unconfirmedTransactionsCount: unconfirmedTransactionsCountSelector(state),
    providerRequests,
    showPrivacyModeNotification: migratedPrivacyMode,
    shouldShowSeedPhraseReminder: !seedPhraseBackedUp && (parseInt(accountBalance, 16) > 0 || tokens.length > 0),
    isPopup,
    show3BoxModalAfterImport,
  }
}

const mapDispatchToProps = (dispatch) => ({
  unsetMigratedPrivacyMode: () => dispatch(unsetMigratedPrivacyMode()),
  show3BoxRestoreConfirmModal: () => dispatch(showModal({ name: 'THREEBOX_RESTORE_CONFIRM' }))
})

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Home)
