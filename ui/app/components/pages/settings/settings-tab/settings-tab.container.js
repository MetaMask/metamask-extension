import SettingsTab from './settings-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  setCurrentCurrency,
  updateAndSetCustomRpc,
  displayWarning,
  revealSeedConfirmation,
  setUseBlockie,
  updateCurrentLocale,
  setFeatureFlag,
  showModal,
  setUseNativeCurrencyAsPrimaryCurrencyPreference,
} from '../../../../actions'
import { preferencesSelector } from '../../../../selectors'

const mapStateToProps = state => {
  const { appState: { warning }, metamask } = state
  const {
    currentCurrency,
    conversionDate,
    nativeCurrency,
    useBlockie,
    featureFlags: {
      sendHexData,
      privacyMode,
      mobileSync,
    } = {},
    provider = {},
    isMascara,
    currentLocale,
  } = metamask
  const { useNativeCurrencyAsPrimaryCurrency } = preferencesSelector(state)

  return {
    warning,
    isMascara,
    currentLocale,
    currentCurrency,
    conversionDate,
    nativeCurrency,
    useBlockie,
    sendHexData,
    privacyMode,
    provider,
    useNativeCurrencyAsPrimaryCurrency,
    mobileSync,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setCurrentCurrency: currency => dispatch(setCurrentCurrency(currency)),
    setRpcTarget: (newRpc, chainId, ticker, nickname) => dispatch(updateAndSetCustomRpc(newRpc, chainId, ticker, nickname)),
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
    setUseNativeCurrencyAsPrimaryCurrencyPreference: value => {
      return dispatch(setUseNativeCurrencyAsPrimaryCurrencyPreference(value))
    },
    showClearApprovalModal: () => dispatch(showModal({ name: 'CLEAR_APPROVED_ORIGINS' })),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(SettingsTab)
