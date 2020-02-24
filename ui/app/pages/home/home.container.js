import Home from './home.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { unconfirmedTransactionsCountSelector } from '../../selectors/confirm-transaction'
<<<<<<< HEAD
import { getCurrentEthBalance, getDaiV1Token } from '../../selectors/selectors'
=======
import { getCurrentEthBalance, getDaiV1Token, getFirstPermissionRequest } from '../../selectors/selectors'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
import {
  unsetMigratedPrivacyMode,
  restoreFromThreeBox,
  turnThreeBoxSyncingOn,
  getThreeBoxLastUpdated,
  setShowRestorePromptToFalse,
} from '../../store/actions'
import { setThreeBoxLastUpdated } from '../../ducks/app/app'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../app/scripts/lib/enums'

<<<<<<< HEAD
const mapStateToProps = state => {
=======
const mapStateToProps = (state) => {
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
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

  const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
  const firstPermissionsRequest = getFirstPermissionRequest(state)
  const firstPermissionsRequestId = (firstPermissionsRequest && firstPermissionsRequest.metadata)
    ? firstPermissionsRequest.metadata.id
    : null

  return {
    forgottenPassword,
    suggestedTokens,
    unconfirmedTransactionsCount: unconfirmedTransactionsCountSelector(state),
<<<<<<< HEAD
    providerRequests,
    showPrivacyModeNotification: migratedPrivacyMode,
=======
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
    shouldShowSeedPhraseReminder: !seedPhraseBackedUp && (parseInt(accountBalance, 16) > 0 || tokens.length > 0),
    isPopup,
    threeBoxSynced,
    showRestorePrompt,
    selectedAddress,
    threeBoxLastUpdated,
    hasDaiV1Token: Boolean(getDaiV1Token(state)),
<<<<<<< HEAD
=======
    firstPermissionsRequestId,
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
  }
}

const mapDispatchToProps = (dispatch) => ({
  unsetMigratedPrivacyMode: () => dispatch(unsetMigratedPrivacyMode()),
  turnThreeBoxSyncingOn: () => dispatch(turnThreeBoxSyncingOn()),
  setupThreeBox: () => {
    dispatch(getThreeBoxLastUpdated())
      .then((lastUpdated) => {
        if (lastUpdated) {
          dispatch(setThreeBoxLastUpdated(lastUpdated))
        } else {
          dispatch(setShowRestorePromptToFalse())
          dispatch(turnThreeBoxSyncingOn())
        }
      })
  },
  restoreFromThreeBox: (address) => dispatch(restoreFromThreeBox(address)),
  setShowRestorePromptToFalse: () => dispatch(setShowRestorePromptToFalse()),
})

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Home)
