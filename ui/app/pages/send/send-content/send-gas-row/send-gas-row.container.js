import { connect } from 'react-redux'
import { isValidContractAddress } from 'cfx-util'
import {
  getSendTo,
  getConversionRate,
  getGasAndCollateralTotal,
  getStorageTotal,
  getGasTotal,
  getGasPrice,
  getGasLimit,
  getStorageLimit,
  getSendAmount,
  getSendFromBalance,
  getTokenBalance,
} from '../../send.selectors.js'
import { getMaxModeOn } from '../send-amount-row/amount-max-button/amount-max-button.selectors'
import {
  isBalanceSufficient,
  calcGasTotal,
  calcStorageTotal,
} from '../../send.utils.js'
import { calcMaxAmount } from '../send-amount-row/amount-max-button/amount-max-button.utils'
import {
  getBasicGasEstimateLoadingStatus,
  getRenderableEstimateDataForSmallButtonsFromGWEI,
  getDefaultActiveButtonIndex,
} from '../../../../selectors/custom-gas'
import {
  showGasButtonGroup,
  updateSendErrors,
} from '../../../../ducks/send/send.duck'
import {
  setCustomGasPrice,
  setCustomGasLimit,
} from '../../../../ducks/gas/gas.duck'
import { setCustomStorageLimit } from '../../../../ducks/storageLimit/storageLimit.duck'
import {
  getGasLoadingError,
  gasAndCollateralFeeIsInError,
  getGasButtonGroupShown,
} from './send-gas-row.selectors.js'
import {
  showModal,
  setStorageLimit,
  setGasPrice,
  setGasLimit,
  setGasTotal,
  setStorageTotal,
  updateSendAmount,
  resetAllCustomData,
} from '../../../../store/actions'
import {
  getAdvancedInlineGasShown,
  getCurrentEthBalance,
  getSelectedToken,
} from '../../../../selectors/selectors'
import SendGasRow from './send-gas-row.component'

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(SendGasRow)

function mapStateToProps (state) {
  const gasButtonInfo = getRenderableEstimateDataForSmallButtonsFromGWEI(state)
  const gasPrice = getGasPrice(state)
  const gasLimit = getGasLimit(state)
  const storageLimit = getStorageLimit(state)
  const activeButtonIndex = getDefaultActiveButtonIndex(gasButtonInfo, gasPrice)

  const gasTotal = getGasTotal(state)
  const storageTotal = getStorageTotal(state)
  const gasAndCollateralTotal = getGasAndCollateralTotal(state)
  const conversionRate = getConversionRate(state)
  const balance = getCurrentEthBalance(state)
  const selectedToken = getSelectedToken(state)
  const isSimpleTx = !(selectedToken || isValidContractAddress(getSendTo(state)))

  const insufficientBalance = !isBalanceSufficient({
    amount: getSelectedToken(state) ? '0x0' : getSendAmount(state),
    gasAndCollateralTotal,
    balance,
    conversionRate,
  })

  return {
    isSimpleTx,
    balance: getSendFromBalance(state),
    gasTotal,
    storageTotal,
    gasAndCollateralTotal,
    gasAndCollateralFeeError: gasAndCollateralFeeIsInError(state),
    gasLoadingError: getGasLoadingError(state),
    gasPriceButtonGroupProps: {
      buttonDataLoading: getBasicGasEstimateLoadingStatus(state),
      defaultActiveButtonIndex: 1,
      newActiveButtonIndex: activeButtonIndex > -1 ? activeButtonIndex : null,
      gasButtonInfo,
    },
    gasButtonGroupShown: getGasButtonGroupShown(state),
    advancedInlineGasShown: getAdvancedInlineGasShown(state),
    gasPrice,
    gasLimit,
    storageLimit,
    insufficientBalance,
    maxModeOn: getMaxModeOn(state),
    selectedToken: getSelectedToken(state),
    tokenBalance: getTokenBalance(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showCustomizeGasModal: () =>
      dispatch(showModal({ name: 'CUSTOMIZE_GAS', hideBasic: true })),
    showCustomizeStorageModal: () =>
      dispatch(showModal({ name: 'CUSTOMIZE_STORAGE', hideBasic: true })),
    setGasPrice: (newPrice, gasLimit) => {
      dispatch(setGasPrice(newPrice))
      dispatch(setCustomGasPrice(newPrice))
      if (gasLimit) {
        dispatch(setGasTotal(calcGasTotal(gasLimit, newPrice)))
      }
    },
    setGasLimit: (newLimit, gasPrice) => {
      dispatch(setGasLimit(newLimit))
      dispatch(setCustomGasLimit(newLimit))
      if (gasPrice) {
        dispatch(setGasTotal(calcGasTotal(newLimit, gasPrice)))
      }
    },
    setStorageLimit: (newLimit) => {
      dispatch(setStorageLimit(newLimit))
      dispatch(setCustomStorageLimit(newLimit))
      dispatch(setStorageTotal(calcStorageTotal(newLimit)))
    },
    setAmountToMax: (maxAmountDataObject) => {
      dispatch(updateSendErrors({ amount: null }))
      dispatch(updateSendAmount(calcMaxAmount(maxAmountDataObject)))
    },
    showGasButtonGroup: () => dispatch(showGasButtonGroup()),
    resetCustomData: () => dispatch(resetAllCustomData()),
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const { gasPriceButtonGroupProps } = stateProps
  const { gasButtonInfo } = gasPriceButtonGroupProps
  const {
    setGasPrice: dispatchSetGasPrice,
    showGasButtonGroup: dispatchShowGasButtonGroup,
    resetCustomData: dispatchResetCustomData,
    ...otherDispatchProps
  } = dispatchProps

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    gasPriceButtonGroupProps: {
      ...gasPriceButtonGroupProps,
      handleGasPriceSelection: dispatchSetGasPrice,
    },
    resetGasButtons: () => {
      dispatchResetCustomData()
      dispatchSetGasPrice(gasButtonInfo[1].priceInHexWei)
      dispatchShowGasButtonGroup()
    },
    setGasPrice: dispatchSetGasPrice,
  }
}
