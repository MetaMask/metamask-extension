import Home from './home.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { unconfirmedTransactionsCountSelector } from '../../selectors/confirm-transaction'
import { getCurrentEthBalance } from '../../selectors/selectors'
import {
  unsetMigratedPrivacyMode,
  restoreFromThreeBox,
  turnThreeBoxSyncingOn,
  getThreeBoxLastUpdated,
  setRestoredFromThreeBox,
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
    restoredFromThreeBox,
    selectedAddress,
  } = metamask
  const accountBalance = getCurrentEthBalance(state)
  const { forgottenPassword, threeBoxLastUpdated } = appState

  const isPopup = getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP

  return {
    forgottenPassword,
    suggestedTokens,
    unconfirmedTransactionsCount: unconfirmedTransactionsCountSelector(state),
    providerRequests,
    showPrivacyModeNotification: migratedPrivacyMode,
    shouldShowSeedPhraseReminder: !seedPhraseBackedUp && (parseInt(accountBalance, 16) > 0 || tokens.length > 0),
    isPopup,
    threeBoxSynced,
    restoredFromThreeBox,
    selectedAddress,
    threeBoxLastUpdated,
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
          dispatch(setRestoredFromThreeBox(false))
          dispatch(turnThreeBoxSyncingOn())
        }
      })
  },
  restoreFromThreeBox: (address) => dispatch(restoreFromThreeBox(address)),
  setRestoredFromThreeBox: (restored) => dispatch(setRestoredFromThreeBox(restored)),
})

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Home)
