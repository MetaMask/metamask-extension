import SettingsTab from './settings-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  setCurrentCurrency,
  setRpcTarget,
  displayWarning,
  revealSeedConfirmation,
  setUseBlockie,
  updateCurrentLocale,
  setFeatureFlag,
  showModal,
  setUseETHAsPrimaryCurrencyPreference,
} from '../../../../actions'
import { preferencesSelector } from '../../../../selectors'

const mapStateToProps = state => {
  const { appState: { warning }, metamask } = state
  const {
    currentCurrency,
    conversionDate,
    useBlockie,
    featureFlags: {
      sendHexData,
      privacyMode,
    } = {},
    provider = {},
    isMascara,
    currentLocale,
  } = metamask
  const { useETHAsPrimaryCurrency } = preferencesSelector(state)

  return {
    warning,
    isMascara,
    currentLocale,
    currentCurrency,
    conversionDate,
    useBlockie,
    sendHexData,
    privacyMode,
    provider,
    useETHAsPrimaryCurrency,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setCurrentCurrency: currency => dispatch(setCurrentCurrency(currency)),
    setRpcTarget: newRpc => dispatch(setRpcTarget(newRpc)),
    displayWarning: warning => dispatch(displayWarning(warning)),
    revealSeedConfirmation: () => dispatch(revealSeedConfirmation()),
    setUseBlockie: value => dispatch(setUseBlockie(value)),
    updateCurrentLocale: key => dispatch(updateCurrentLocale(key)),
    setFeatureFlagToBeta: () => {
      return dispatch(setFeatureFlag('betaUI', false, 'OLD_UI_NOTIFICATION_MODAL'))
    },
    setHexDataFeatureFlag: shouldShow => dispatch(setFeatureFlag('sendHexData', shouldShow)),
    setPrivacyMode: enabled => dispatch(setFeatureFlag('privacyMode', enabled)),
    showResetAccountConfirmationModal: () => dispatch(showModal({ name: 'CONFIRM_RESET_ACCOUNT' })),
    setUseETHAsPrimaryCurrencyPreference: value => {
      return dispatch(setUseETHAsPrimaryCurrencyPreference(value))
    },
    showClearApprovalModal: () => dispatch(showModal({ name: 'CLEAR_APPROVED_ORIGINS' })),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(SettingsTab)
