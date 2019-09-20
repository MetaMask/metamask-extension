import Home from './home.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { unconfirmedTransactionsCountSelector } from '../../selectors/confirm-transaction'
import { getCurrentEthBalance } from '../../selectors/selectors'
import {
  restoreFromThreeBox,
  turnThreeBoxSyncingOn,
  getThreeBoxLastUpdated,
  setRestoredFromThreeBoxToFalse,
  deletePlugin,
  clearPluginState,
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
  deletePlugin: (pluginName) => dispatch(deletePlugin(pluginName)),
  clearPluginState: () => dispatch(clearPluginState()),
})

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Home)
