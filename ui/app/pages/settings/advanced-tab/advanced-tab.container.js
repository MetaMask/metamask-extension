import AdvancedTab from './advanced-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  updateAndSetCustomRpc,
  displayWarning,
  setFeatureFlag,
  showModal,
  setShowFiatConversionOnTestnetsPreference,
  setAutoLogoutTimeLimit,
  setThreeBoxSyncingPermission,
} from '../../../store/actions'
import {preferencesSelector} from '../../../selectors/selectors'

export const mapStateToProps = state => {
  const { appState: { warning }, metamask } = state
  const {
    featureFlags: {
      sendHexData,
      advancedInlineGas,
    } = {},
    threeBoxSyncingAllowed,
    threeBoxDisabled,
  } = metamask
  const { showFiatInTestnets, autoLogoutTimeLimit } = preferencesSelector(state)

  return {
    warning,
    sendHexData,
    advancedInlineGas,
    showFiatInTestnets,
    autoLogoutTimeLimit,
    threeBoxSyncingAllowed,
    threeBoxDisabled,
  }
}

export const mapDispatchToProps = dispatch => {
  return {
    setHexDataFeatureFlag: shouldShow => dispatch(setFeatureFlag('sendHexData', shouldShow)),
    setRpcTarget: (newRpc, chainId, ticker, nickname) => dispatch(updateAndSetCustomRpc(newRpc, chainId, ticker, nickname)),
    displayWarning: warning => dispatch(displayWarning(warning)),
    showResetAccountConfirmationModal: () => dispatch(showModal({ name: 'CONFIRM_RESET_ACCOUNT' })),
    setAdvancedInlineGasFeatureFlag: shouldShow => dispatch(setFeatureFlag('advancedInlineGas', shouldShow)),
    setShowFiatConversionOnTestnetsPreference: value => {
      return dispatch(setShowFiatConversionOnTestnetsPreference(value))
    },
    setAutoLogoutTimeLimit: value => {
      return dispatch(setAutoLogoutTimeLimit(value))
    },
    setThreeBoxSyncingPermission: newThreeBoxSyncingState => dispatch(setThreeBoxSyncingPermission(newThreeBoxSyncingState)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(AdvancedTab)
