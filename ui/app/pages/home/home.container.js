import Home from './home.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { unconfirmedTransactionsCountSelector } from '../../selectors/confirm-transaction'
import {
  getDaiV1Token,
  getCurrentEthBalance,
  getAllPermissions,
  getAllPlugins,
  getPermissionsHistory,
  getPermissionsLog,
} from '../../selectors/selectors'
import {
  restoreFromThreeBox,
  turnThreeBoxSyncingOn,
  getThreeBoxLastUpdated,
  removePlugin,
  clearPlugins,
  clearAllPermissionsData,
  setShowRestorePromptToFalse,
} from '../../store/actions'
import { setThreeBoxLastUpdated } from '../../ducks/app/app'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../app/scripts/lib/enums'

const mapStateToProps = state => {
  const { activeTab, metamask, appState } = state
  const {
    suggestedTokens,
    seedPhraseBackedUp,
    tokens,
    threeBoxSynced,
    showRestorePrompt,
    selectedAddress,
    permissionsRequests,
  } = metamask
  const accountBalance = getCurrentEthBalance(state)
  const { forgottenPassword, threeBoxLastUpdated } = appState

  const isPopup = getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP

  // TODO:plugins:prod remove
  const hasPermissionsData = (
    Object.keys(getAllPermissions(state)).length > 0 ||
    Object.keys(getPermissionsHistory(state)).length > 0 ||
    Object.keys(getPermissionsLog(state)).length > 0
  )
  const hasPlugins = Object.keys(getAllPlugins(state)).length > 0

  return {
    forgottenPassword,
    suggestedTokens,
    unconfirmedTransactionsCount: unconfirmedTransactionsCountSelector(state),
    activeTab,
    shouldShowSeedPhraseReminder: !seedPhraseBackedUp && (parseInt(accountBalance, 16) > 0 || tokens.length > 0),
    isPopup,
    threeBoxSynced,
    showRestorePrompt,
    selectedAddress,
    threeBoxLastUpdated,
    hasDaiV1Token: Boolean(getDaiV1Token(state)),
    permissionsRequests,
    // TODO:plugins:prod remove
    hasPermissionsData,
    hasPlugins,
  }
}

const mapDispatchToProps = (dispatch) => ({
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
  restoreFromThreeBox: (address) => dispatch(restoreFromThreeBox(address)),
  setShowRestorePromptToFalse: () => dispatch(setShowRestorePromptToFalse()),
  removePlugin: (pluginName) => dispatch(removePlugin(pluginName)),
  clearPlugins: () => dispatch(clearPlugins()),
  clearAllPermissionsData: () => dispatch(clearAllPermissionsData()),
})

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Home)
