import Home from './home.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { unconfirmedTransactionsCountSelector } from '../../selectors/confirm-transaction'
import { getCurrentEthBalance, getDaiV1Token } from '../../selectors/selectors'
import {
  unsetMigratedPrivacyMode,
  restoreFromThreeBox,
  turnThreeBoxSyncingOn,
  getThreeBoxLastUpdated,
  setShowRestorePromptToFalse,
  buyEth,
} from '../../store/actions'
import { setThreeBoxLastUpdated } from '../../ducks/app/app'
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
    threeBoxSynced,
    showRestorePrompt,
    selectedAddress,
  } = metamask
  const accountBalance = getCurrentEthBalance(state)
  const { forgottenPassword, threeBoxLastUpdated } = appState

  const isPopup = getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP
  const requestedEmbeddedIntegration = new URLSearchParams(window.location.search).get('openEmbeddedIntegration')

  return {
    forgottenPassword,
    suggestedTokens,
    unconfirmedTransactionsCount: unconfirmedTransactionsCountSelector(state),
    providerRequests,
    showPrivacyModeNotification: migratedPrivacyMode,
    shouldShowSeedPhraseReminder: !seedPhraseBackedUp && (parseInt(accountBalance, 16) > 0 || tokens.length > 0),
    isPopup,
    threeBoxSynced,
    showRestorePrompt,
    selectedAddress,
    threeBoxLastUpdated,
    requestedEmbeddedIntegration,
    hasDaiV1Token: Boolean(getDaiV1Token(state)),
  }
}

const mapDispatchToProps = (dispatch) => ({
  unsetMigratedPrivacyMode: () => dispatch(unsetMigratedPrivacyMode()),
  turnThreeBoxSyncingOn: () => dispatch(turnThreeBoxSyncingOn()),
  setupThreeBox: () => {
    dispatch(getThreeBoxLastUpdated())
      .then(lastUpdated => {
        if (lastUpdated) {
          dispatch(setThreeBoxLastUpdated(lastUpdated))
        } else {
          dispatch(setShowRestorePromptToFalse())
          dispatch(turnThreeBoxSyncingOn())
        }
      })
  },
  buyEth: (opts) => dispatch(buyEth(opts)),
  restoreFromThreeBox: (address) => dispatch(restoreFromThreeBox(address)),
  setShowRestorePromptToFalse: () => dispatch(setShowRestorePromptToFalse()),
})

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Home)
