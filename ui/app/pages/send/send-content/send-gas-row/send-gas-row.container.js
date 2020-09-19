import { connect } from 'react-redux'
import { isValidContractAddress } from 'cfx-util'
import {
  getSendTo,
  getConversionRate,
  getStorageTotal,
  getGasTotal,
  getGasPrice,
  getGasLimit,
  getStorageLimit,
  getSendAmount,
  getSendFromBalance,
  getTokenBalance,
  getSponsorshipInfo,
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
  updateSponsorshipInfo,
} from '../../../../store/actions'
import {
  getAdvancedInlineGasShown,
  getCurrentEthBalance,
  getSelectedToken,
  getSelectedAddress,
} from '../../../../selectors/selectors'
import SendGasRow from './send-gas-row.component'

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(SendGasRow)

function mapStateToProps (state) {
  const selectedAddress = getSelectedAddress(state)
  const gasButtonInfo = getRenderableEstimateDataForSmallButtonsFromGWEI(state)
  const gasPrice = getGasPrice(state)
  const gasLimit = getGasLimit(state)
  const storageLimit = getStorageLimit(state)
  const activeButtonIndex = getDefaultActiveButtonIndex(gasButtonInfo, gasPrice)

  const gasTotal = getGasTotal(state)
  const storageTotal = getStorageTotal(state)
  const conversionRate = getConversionRate(state)
  const balance = getCurrentEthBalance(state)
  const selectedToken = getSelectedToken(state)
  const isSimpleTx = !(
    selectedToken || isValidContractAddress(getSendTo(state))
  )

  const sponsorshipInfo = getSponsorshipInfo(state) || {
    willUserPayTxFee: true,
  }

  const { willUserPayTxFee } = sponsorshipInfo

  const insufficientBalance = !isBalanceSufficient({
    amount: getSelectedToken(state) ? '0x0' : getSendAmount(state),
    gasTotal: calcGasTotal(
      willUserPayTxFee ? gasLimit : '0',
      willUserPayTxFee ? gasPrice : '0'
    ),
    balance,
    conversionRate,
  })

  return {
    isSimpleTx,
    balance: getSendFromBalance(state),
    gasTotal,
    storageTotal,
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
    selectedToken,
    selectedAddress,
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
    updateSponsorshipInfo: (params) => dispatch(updateSponsorshipInfo(params)),
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const {
    gasPriceButtonGroupProps,
    selectedAddress,
    selectedToken,
    gasPrice,
    gasLimit,
    storageLimit,
  } = stateProps
  const { gasButtonInfo } = gasPriceButtonGroupProps
  const {
    setGasPrice: dispatchSetGasPrice,
    showGasButtonGroup: dispatchShowGasButtonGroup,
    resetCustomData: dispatchResetCustomData,
    setGasLimit: dispatchSetGasLimit,
    setStorageLimit: dispatchSetStorageLimit,
    updateSponsorshipInfo: dispatchUpdateSponsorshipInfo,
    ...otherDispatchProps
  } = dispatchProps
  const updateSponsorInfoParams = {
    selectedAddress,
    selectedToken,
    gasPrice,
    gasLimit,
    storageLimit,
  }
  const dispatchSetGasPriceAndUpdateSponsorshipInfo = (...args) => {
    dispatchSetGasPrice(...args)
    dispatchUpdateSponsorshipInfo({
      ...updateSponsorInfoParams,
      gasPrice: args[0],
    })
  }
  const dispatchSetGasLimitAndUpdateSponsorshipInfo = (...args) => {
    dispatchSetGasLimit(...args)
    dispatchUpdateSponsorshipInfo({
      ...updateSponsorInfoParams,
      gasLimit: args[0],
    })
  }
  const dispatchSetStorageLimitAndUpdateSponsorshipInfo = (...args) => {
    dispatchSetStorageLimit(...args)
    dispatchUpdateSponsorshipInfo({
      ...updateSponsorInfoParams,
      storageLimit: args[0],
    })
  }

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    setGasPrice: dispatchSetGasPriceAndUpdateSponsorshipInfo,
    setGasLimit: dispatchSetGasLimitAndUpdateSponsorshipInfo,
    setStorageLimit: dispatchSetStorageLimitAndUpdateSponsorshipInfo,
    gasPriceButtonGroupProps: {
      ...gasPriceButtonGroupProps,
      handleGasPriceSelection: dispatchSetGasPriceAndUpdateSponsorshipInfo,
    },
    resetGasButtons: () => {
      dispatchResetCustomData()
      dispatchSetGasPrice(gasButtonInfo[1].priceInHexWei)
      dispatchShowGasButtonGroup()
    },
  }
}
