import { connect } from 'react-redux'
import { pipe, partialRight } from 'ramda'
import GasModalPageContainer from './gas-modal-page-container.component'
import {
  hideModal,
  setGasLimit,
  setGasPrice,
  createSpeedUpTransaction,
  hideSidebar,
  updateSendAmount,
  setGasTotal,
  updateTransaction,
} from '../../../../store/actions'
import {
  setCustomGasPrice,
  setCustomGasLimit,
  resetCustomData,
  setCustomTimeEstimate,
  fetchGasEstimates,
  fetchBasicGasAndTimeEstimates,
} from '../../../../ducks/gas/gas.duck'
import {
  hideGasButtonGroup,
  updateSendErrors,
} from '../../../../ducks/send/send.duck'
import {
  conversionRateSelector as getConversionRate,
  getCurrentCurrency,
  getCurrentEthBalance,
  getIsMainnet,
  getSelectedToken,
  isEthereumNetwork,
  preferencesSelector,
} from '../../../../selectors/selectors.js'
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
} from '../../../../selectors/custom-gas'
import {
  getTokenBalance,
} from '../../../../pages/send/send.selectors'
import {
  formatCurrency,
} from '../../../../helpers/utils/confirm-tx.util'
import {
  addHexWEIsToDec,
  subtractHexWEIsToDec,
  decEthToConvertedCurrency as ethTotalToConvertedCurrency,
  decGWEIToHexWEI,
  hexWEIToDecGWEI,
} from '../../../../helpers/utils/conversions.util'
import {
  formatETHFee,
} from '../../../../helpers/utils/formatters'
import {
  calcGasTotal,
  isBalanceSufficient,
} from '../../../../pages/send/send.utils'
import { addHexPrefix } from 'ethereumjs-util'
import { getAdjacentGasPrices, extrapolateY } from '../gas-price-chart/gas-price-chart.utils'
import { getMaxModeOn } from '../../../../pages/send/send-content/send-amount-row/amount-max-button/amount-max-button.selectors'
import { calcMaxAmount } from '../../../../pages/send/send-content/send-amount-row/amount-max-button/amount-max-button.utils'

const mapStateToProps = (state, ownProps) => {
  const { selectedAddressTxList } = state.metamask
  const { modalState: { props: modalProps } = {} } = state.appState.modal || {}
  const { txData = {} } = modalProps || {}
  const { transaction = {} } = ownProps
  const selectedTransaction = selectedAddressTxList.find(({ id }) => id === (transaction.id || txData.id))

  const buttonDataLoading = getBasicGasEstimateLoadingStatus(state)
  const gasEstimatesLoading = getGasEstimatesLoadingStatus(state)

  const { gasPrice: currentGasPrice, gas: currentGasLimit, value } = getTxParams(state, selectedTransaction)
  const customModalGasPriceInHex = getCustomGasPrice(state) || currentGasPrice
  const customModalGasLimitInHex = getCustomGasLimit(state) || currentGasLimit
  const customGasTotal = calcGasTotal(customModalGasLimitInHex, customModalGasPriceInHex)

  const gasButtonInfo = getRenderableBasicEstimateData(state, customModalGasLimitInHex)

  const currentCurrency = getCurrentCurrency(state)
  const conversionRate = getConversionRate(state)

  const newTotalFiat = addHexWEIsToRenderableFiat(value, customGasTotal, currentCurrency, conversionRate)

  const hideBasic = state.appState.modal.modalState.props.hideBasic

  const customGasPrice = calcCustomGasPrice(customModalGasPriceInHex)

  const maxModeOn = getMaxModeOn(state)

  const gasPrices = getEstimatedGasPrices(state)
  const estimatedTimes = getEstimatedGasTimes(state)
  const balance = getCurrentEthBalance(state)

  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)
  const showFiat = Boolean(isMainnet || showFiatInTestnets)

  const newTotalEth = maxModeOn ? addHexWEIsToRenderableEth(balance, '0x0') : addHexWEIsToRenderableEth(value, customGasTotal)

  const sendAmount = maxModeOn ? subtractHexWEIsFromRenderableEth(balance, customGasTotal) : addHexWEIsToRenderableEth(value, '0x0')

  const insufficientBalance = maxModeOn ? false : !isBalanceSufficient({
    amount: value,
    gasTotal: customGasTotal,
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
    customGasTotal,
    newTotalFiat,
    currentTimeEstimate: getRenderableTimeEstimate(customGasPrice, gasPrices, estimatedTimes),
    blockTime: getBasicGasEstimateBlockTime(state),
    customPriceIsSafe: isCustomPriceSafe(state),
    maxModeOn,
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
      originalTotalFiat: addHexWEIsToRenderableFiat(value, customGasTotal, currentCurrency, conversionRate),
      originalTotalEth: addHexWEIsToRenderableEth(value, customGasTotal),
      newTotalFiat: showFiat ? newTotalFiat : '',
      newTotalEth,
      transactionFee: addHexWEIsToRenderableEth('0x0', customGasTotal),
      sendAmount,
    },
    transaction: txData || transaction,
    isSpeedUp: transaction.status === 'submitted',
    txId: transaction.id,
    insufficientBalance,
    gasEstimatesLoading,
    isMainnet,
    isEthereumNetwork: isEthereumNetwork(state),
    selectedToken: getSelectedToken(state),
    balance,
    tokenBalance: getTokenBalance(state),
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
    updateConfirmTxGasAndCalculate: (gasLimit, gasPrice, updatedTx) => {
      updateCustomGasPrice(gasPrice)
      dispatch(setCustomGasLimit(addHexPrefix(gasLimit.toString(16))))
      return dispatch(updateTransaction(updatedTx))
    },
    createSpeedUpTransaction: (txId, gasPrice) => {
      return dispatch(createSpeedUpTransaction(txId, gasPrice))
    },
    hideGasButtonGroup: () => dispatch(hideGasButtonGroup()),
    setCustomTimeEstimate: (timeEstimateInSeconds) => dispatch(setCustomTimeEstimate(timeEstimateInSeconds)),
    hideSidebar: () => dispatch(hideSidebar()),
    fetchGasEstimates: (blockTime) => dispatch(fetchGasEstimates(blockTime)),
    fetchBasicGasAndTimeEstimates: () => dispatch(fetchBasicGasAndTimeEstimates()),
    setGasTotal: (total) => dispatch(setGasTotal(total)),
    setAmountToMax: (maxAmountDataObject) => {
      dispatch(updateSendErrors({ amount: null }))
      dispatch(updateSendAmount(calcMaxAmount(maxAmountDataObject)))
    },
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    gasPriceButtonGroupProps,
    isConfirm,
    txId,
    isSpeedUp,
    insufficientBalance,
    maxModeOn,
    customGasPrice,
    customGasTotal,
    balance,
    selectedToken,
    tokenBalance,
    customGasLimit,
    transaction,
  } = stateProps
  const {
    updateCustomGasPrice: dispatchUpdateCustomGasPrice,
    hideGasButtonGroup: dispatchHideGasButtonGroup,
    setGasData: dispatchSetGasData,
    updateConfirmTxGasAndCalculate: dispatchUpdateConfirmTxGasAndCalculate,
    createSpeedUpTransaction: dispatchCreateSpeedUpTransaction,
    hideSidebar: dispatchHideSidebar,
    cancelAndClose: dispatchCancelAndClose,
    hideModal: dispatchHideModal,
    setAmountToMax: dispatchSetAmountToMax,
    ...otherDispatchProps
  } = dispatchProps

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    onSubmit: (gasLimit, gasPrice) => {
      if (isConfirm) {
        const updatedTx = {
          ...transaction,
          txParams: {
            ...transaction.txParams,
            gas: gasLimit,
            gasPrice,
          },
        }
        dispatchUpdateConfirmTxGasAndCalculate(gasLimit, gasPrice, updatedTx)
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
      if (maxModeOn) {
        dispatchSetAmountToMax({
          balance,
          gasTotal: customGasTotal,
          selectedToken,
          tokenBalance,
        })
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
    disableSave: insufficientBalance || (isSpeedUp && customGasPrice === 0) || customGasLimit < 21000,
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

function getTxParams (state, selectedTransaction = {}) {
  const { metamask: { send } } = state
  const { txParams } = selectedTransaction
  return txParams || {
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

function subtractHexWEIsFromRenderableEth (aHexWEI, bHexWei) {
  return pipe(
    subtractHexWEIsToDec,
    formatETHFee
  )(aHexWEI, bHexWei)
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
