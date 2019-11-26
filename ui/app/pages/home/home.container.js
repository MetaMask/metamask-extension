import Home from './home.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { unconfirmedTransactionsCountSelector } from '../../selectors/confirm-transaction'
import {
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
  setRestoredFromThreeBoxToFalse,
  removePlugin,
  clearPlugins,
  clearAllPermissionsData,
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
    restoredFromThreeBox,
    selectedAddress,
    featureFlags,
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
    restoredFromThreeBox,
    selectedAddress,
    threeBoxLastUpdated,
    threeBoxFeatureFlagIsTrue: featureFlags.threeBox,
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
          dispatch(setRestoredFromThreeBoxToFalse())
          dispatch(turnThreeBoxSyncingOn())
        }
      })
  },
  restoreFromThreeBox: (address) => dispatch(restoreFromThreeBox(address)),
  setRestoredFromThreeBoxToFalse: () => dispatch(setRestoredFromThreeBoxToFalse()),
  removePlugin: (pluginName) => dispatch(removePlugin(pluginName)),
  clearPlugins: () => dispatch(clearPlugins()),
  clearAllPermissionsData: () => dispatch(clearAllPermissionsData()),
})

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Home)
