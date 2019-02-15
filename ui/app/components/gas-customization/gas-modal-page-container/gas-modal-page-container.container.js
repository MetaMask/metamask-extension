import { connect } from 'react-redux'
import { pipe, partialRight } from 'ramda'
import GasModalPageContainer from './gas-modal-page-container.component'
import {
  hideModal,
  setGasLimit,
  setGasPrice,
  createSpeedUpTransaction,
  hideSidebar,
} from '../../../actions'
import {
  setCustomGasPrice,
  setCustomGasLimit,
  resetCustomData,
  setCustomTimeEstimate,
  fetchGasEstimates,
  fetchBasicGasAndTimeEstimates,
} from '../../../ducks/gas.duck'
import {
  hideGasButtonGroup,
} from '../../../ducks/send.duck'
import {
  updateGasAndCalculate,
} from '../../../ducks/confirm-transaction.duck'
import {
  getCurrentCurrency,
  conversionRateSelector as getConversionRate,
  getSelectedToken,
  getCurrentEthBalance,
} from '../../../selectors.js'
import {
  formatTimeEstimate,
  getFastPriceEstimateInHexWEI,
  getBasicGasEstimateLoadingStatus,
  getGasEstimatesLoadingStatus,
  getCustomGasLimit,
  getCustomGasPrice,
  getDefaultActiveButtonIndex,
  getEstimatedGasPrices,
  getEstimatedGasTimes,
  getRenderableBasicEstimateData,
  getBasicGasEstimateBlockTime,
  isCustomPriceSafe,
} from '../../../selectors/custom-gas'
import {
  submittedPendingTransactionsSelector,
} from '../../../selectors/transactions'
import {
  formatCurrency,
} from '../../../helpers/confirm-transaction/util'
import {
  addHexWEIsToDec,
  decEthToConvertedCurrency as ethTotalToConvertedCurrency,
  decGWEIToHexWEI,
  hexWEIToDecGWEI,
} from '../../../helpers/conversions.util'
import {
  formatETHFee,
} from '../../../helpers/formatters'
import {
  calcGasTotal,
  isBalanceSufficient,
} from '../../send/send.utils'
import { addHexPrefix } from 'ethereumjs-util'
import { getAdjacentGasPrices, extrapolateY } from '../gas-price-chart/gas-price-chart.utils'
import {getIsMainnet, preferencesSelector} from '../../../selectors'

const mapStateToProps = (state, ownProps) => {
  const { transaction = {} } = ownProps
  const buttonDataLoading = getBasicGasEstimateLoadingStatus(state)
  const gasEstimatesLoading = getGasEstimatesLoadingStatus(state)

  const { gasPrice: currentGasPrice, gas: currentGasLimit, value } = getTxParams(state, transaction.id)
  const customModalGasPriceInHex = getCustomGasPrice(state) || currentGasPrice
  const customModalGasLimitInHex = getCustomGasLimit(state) || currentGasLimit
  const gasTotal = calcGasTotal(customModalGasLimitInHex, customModalGasPriceInHex)

  const customGasTotal = calcGasTotal(customModalGasLimitInHex, customModalGasPriceInHex)

  const gasButtonInfo = getRenderableBasicEstimateData(state, customModalGasLimitInHex)

  const currentCurrency = getCurrentCurrency(state)
  const conversionRate = getConversionRate(state)

  const newTotalFiat = addHexWEIsToRenderableFiat(value, customGasTotal, currentCurrency, conversionRate)

  const hideBasic = state.appState.modal.modalState.props.hideBasic

  const customGasPrice = calcCustomGasPrice(customModalGasPriceInHex)

  const gasPrices = getEstimatedGasPrices(state)
  const estimatedTimes = getEstimatedGasTimes(state)
  const balance = getCurrentEthBalance(state)

  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)
  const showFiat = Boolean(isMainnet || showFiatInTestnets)

  const insufficientBalance = !isBalanceSufficient({
    amount: value,
    gasTotal,
    balance,
    conversionRate,
  })

  return {
    hideBasic,
    isConfirm: isConfirm(state),
    customModalGasPriceInHex,
    customModalGasLimitInHex,
    customGasPrice,
    customGasLimit: calcCustomGasLimit(customModalGasLimitInHex),
    newTotalFiat,
    currentTimeEstimate: getRenderableTimeEstimate(customGasPrice, gasPrices, estimatedTimes),
    blockTime: getBasicGasEstimateBlockTime(state),
    customPriceIsSafe: isCustomPriceSafe(state),
    gasPriceButtonGroupProps: {
      buttonDataLoading,
      defaultActiveButtonIndex: getDefaultActiveButtonIndex(gasButtonInfo, customModalGasPriceInHex),
      gasButtonInfo,
    },
    gasChartProps: {
      currentPrice: customGasPrice,
      gasPrices,
      estimatedTimes,
      gasPricesMax: gasPrices[gasPrices.length - 1],
      estimatedTimesMax: estimatedTimes[0],
    },
    infoRowProps: {
      originalTotalFiat: addHexWEIsToRenderableFiat(value, gasTotal, currentCurrency, conversionRate),
      originalTotalEth: addHexWEIsToRenderableEth(value, gasTotal),
      newTotalFiat: showFiat ? newTotalFiat : '',
      newTotalEth: addHexWEIsToRenderableEth(value, customGasTotal),
      transactionFee: addHexWEIsToRenderableEth('0x0', customGasTotal),
      sendAmount: addHexWEIsToRenderableEth(value, '0x0'),
    },
    isSpeedUp: transaction.status === 'submitted',
    txId: transaction.id,
    insufficientBalance,
    gasEstimatesLoading,
  }
}

const mapDispatchToProps = dispatch => {
  const updateCustomGasPrice = newPrice => dispatch(setCustomGasPrice(addHexPrefix(newPrice)))

  return {
    cancelAndClose: () => {
      dispatch(resetCustomData())
      dispatch(hideModal())
    },
    hideModal: () => dispatch(hideModal()),
    updateCustomGasPrice,
    convertThenUpdateCustomGasPrice: newPrice => updateCustomGasPrice(decGWEIToHexWEI(newPrice)),
    convertThenUpdateCustomGasLimit: newLimit => dispatch(setCustomGasLimit(addHexPrefix(newLimit.toString(16)))),
    setGasData: (newLimit, newPrice) => {
      dispatch(setGasLimit(newLimit))
      dispatch(setGasPrice(newPrice))
    },
    updateConfirmTxGasAndCalculate: (gasLimit, gasPrice) => {
      updateCustomGasPrice(gasPrice)
      dispatch(setCustomGasLimit(addHexPrefix(gasLimit.toString(16))))
      return dispatch(updateGasAndCalculate({ gasLimit, gasPrice }))
    },
    createSpeedUpTransaction: (txId, gasPrice) => {
      return dispatch(createSpeedUpTransaction(txId, gasPrice))
    },
    hideGasButtonGroup: () => dispatch(hideGasButtonGroup()),
    setCustomTimeEstimate: (timeEstimateInSeconds) => dispatch(setCustomTimeEstimate(timeEstimateInSeconds)),
    hideSidebar: () => dispatch(hideSidebar()),
    fetchGasEstimates: (blockTime) => dispatch(fetchGasEstimates(blockTime)),
    fetchBasicGasAndTimeEstimates: () => dispatch(fetchBasicGasAndTimeEstimates()),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { gasPriceButtonGroupProps, isConfirm, txId, isSpeedUp, insufficientBalance, customGasPrice } = stateProps
  const {
    updateCustomGasPrice: dispatchUpdateCustomGasPrice,
    hideGasButtonGroup: dispatchHideGasButtonGroup,
    setGasData: dispatchSetGasData,
    updateConfirmTxGasAndCalculate: dispatchUpdateConfirmTxGasAndCalculate,
    createSpeedUpTransaction: dispatchCreateSpeedUpTransaction,
    hideSidebar: dispatchHideSidebar,
    cancelAndClose: dispatchCancelAndClose,
    hideModal: dispatchHideModal,
    ...otherDispatchProps
  } = dispatchProps

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    onSubmit: (gasLimit, gasPrice) => {
      if (isConfirm) {
        dispatchUpdateConfirmTxGasAndCalculate(gasLimit, gasPrice)
        dispatchHideModal()
      } else if (isSpeedUp) {
        dispatchCreateSpeedUpTransaction(txId, gasPrice)
        dispatchHideSidebar()
        dispatchCancelAndClose()
      } else {
        dispatchSetGasData(gasLimit, gasPrice)
        dispatchHideGasButtonGroup()
        dispatchCancelAndClose()
      }
    },
    gasPriceButtonGroupProps: {
      ...gasPriceButtonGroupProps,
      handleGasPriceSelection: dispatchUpdateCustomGasPrice,
    },
    cancelAndClose: () => {
      dispatchCancelAndClose()
      if (isSpeedUp) {
        dispatchHideSidebar()
      }
    },
    disableSave: insufficientBalance || (isSpeedUp && customGasPrice === 0),
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(GasModalPageContainer)

function isConfirm (state) {
  return Boolean(Object.keys(state.confirmTransaction.txData).length)
}

function calcCustomGasPrice (customGasPriceInHex) {
  return Number(hexWEIToDecGWEI(customGasPriceInHex))
}

function calcCustomGasLimit (customGasLimitInHex) {
  return parseInt(customGasLimitInHex, 16)
}

function getTxParams (state, transactionId) {
  const { confirmTransaction: { txData }, metamask: { send } } = state
  const pendingTransactions = submittedPendingTransactionsSelector(state)
  const pendingTransaction = pendingTransactions.find(({ id }) => id === transactionId)
  const { txParams: pendingTxParams } = pendingTransaction || {}
  return txData.txParams || pendingTxParams || {
    from: send.from,
    gas: send.gasLimit || '0x5208',
    gasPrice: send.gasPrice || getFastPriceEstimateInHexWEI(state, true),
    to: send.to,
    value: getSelectedToken(state) ? '0x0' : send.amount,
  }
}

function addHexWEIsToRenderableEth (aHexWEI, bHexWEI) {
  return pipe(
    addHexWEIsToDec,
    formatETHFee
  )(aHexWEI, bHexWEI)
}

function addHexWEIsToRenderableFiat (aHexWEI, bHexWEI, convertedCurrency, conversionRate) {
  return pipe(
    addHexWEIsToDec,
    partialRight(ethTotalToConvertedCurrency, [convertedCurrency, conversionRate]),
    partialRight(formatCurrency, [convertedCurrency]),
  )(aHexWEI, bHexWEI)
}

function getRenderableTimeEstimate (currentGasPrice, gasPrices, estimatedTimes) {
  const minGasPrice = gasPrices[0]
  const maxGasPrice = gasPrices[gasPrices.length - 1]
  let priceForEstimation = currentGasPrice
  if (currentGasPrice < minGasPrice) {
    priceForEstimation = minGasPrice
  } else if (currentGasPrice > maxGasPrice) {
    priceForEstimation = maxGasPrice
  }

  const {
    closestLowerValueIndex,
    closestHigherValueIndex,
    closestHigherValue,
    closestLowerValue,
  } = getAdjacentGasPrices({ gasPrices, priceToPosition: priceForEstimation })

  const newTimeEstimate = extrapolateY({
    higherY: estimatedTimes[closestHigherValueIndex],
    lowerY: estimatedTimes[closestLowerValueIndex],
    higherX: closestHigherValue,
    lowerX: closestLowerValue,
    xForExtrapolation: priceForEstimation,
  })

  return formatTimeEstimate(newTimeEstimate, currentGasPrice > maxGasPrice, currentGasPrice < minGasPrice)
}
