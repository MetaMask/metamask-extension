import AdvancedTab from './advanced-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  displayWarning,
  setFeatureFlag,
  showModal,
  setShowFiatConversionOnTestnetsPreference,
  setAutoLockTimeLimit,
  setThreeBoxSyncingPermission,
  turnThreeBoxSyncingOnAndInitialize,
  setUseIn3,
  setUseNonceField,
  setIpfsGateway,
} from '../../../store/actions'
import { preferencesSelector } from '../../../selectors/selectors'

export const mapStateToProps = state => {
  const { appState: { warning }, metamask } = state
  const {
    featureFlags: {
      sendHexData,
      advancedInlineGas,
    } = {},
    threeBoxSyncingAllowed,
    threeBoxDisabled,
    useIn3,
    useNonceField,
    ipfsGateway,
  } = metamask
  console.log('adanved-tab.container.js')
  console.log(metamask)
  const { showFiatInTestnets, autoLockTimeLimit } = preferencesSelector(state)

  return {
    warning,
    sendHexData,
    advancedInlineGas,
    showFiatInTestnets,
    autoLockTimeLimit,
    threeBoxSyncingAllowed,
    threeBoxDisabled,
    useIn3,
    useNonceField,
    ipfsGateway,
  }
}

export const mapDispatchToProps = dispatch => {
  return {
    setHexDataFeatureFlag: shouldShow => dispatch(setFeatureFlag('sendHexData', shouldShow)),
    displayWarning: warning => dispatch(displayWarning(warning)),
    showResetAccountConfirmationModal: () => dispatch(showModal({ name: 'CONFIRM_RESET_ACCOUNT' })),
    setAdvancedInlineGasFeatureFlag: shouldShow => dispatch(setFeatureFlag('advancedInlineGas', shouldShow)),
    setUseNonceField: value => dispatch(setUseNonceField(value)),
    setShowFiatConversionOnTestnetsPreference: value => {
      return dispatch(setShowFiatConversionOnTestnetsPreference(value))
    },
    setUseIn3: value => {
      return dispatch(setUseIn3(value))
    },
    setAutoLockTimeLimit: value => {
      return dispatch(setAutoLockTimeLimit(value))
    },
    setThreeBoxSyncingPermission: newThreeBoxSyncingState => {
      if (newThreeBoxSyncingState) {
        dispatch(turnThreeBoxSyncingOnAndInitialize())
      } else {
        dispatch(setThreeBoxSyncingPermission(newThreeBoxSyncingState))
      }
    },
    setIpfsGateway: value => {
      return dispatch(setIpfsGateway(value))
    },
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(AdvancedTab)
