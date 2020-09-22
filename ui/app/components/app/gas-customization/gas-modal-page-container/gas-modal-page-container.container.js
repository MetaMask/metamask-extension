import { connect } from 'react-redux'
import { isValidContractAddress, addHexPrefix } from 'cfx-util'
import { pipe, partialRight } from 'ramda'
import GasModalPageContainer from './gas-modal-page-container.component'
import {
  hideModal,
  setStorageLimit,
  setGasLimit,
  setGasPrice,
  createSpeedUpTransaction,
  hideSidebar,
  updateSendAmount,
  setGasTotal,
  setStorageTotal,
  setGasAndCollateralTotal,
  updateTransaction,
} from '../../../../store/actions'
import {
  setCustomGasPrice,
  setCustomGasLimit,
  resetCustomGasData,
  fetchGasEstimates,
  fetchBasicGasAndTimeEstimates,
} from '../../../../ducks/gas/gas.duck'
import {
  setCustomStorageLimit,
  resetCustomStorageData,
} from '../../../../ducks/storageLimit/storageLimit.duck'
import { resetCustomGasAndCollateralData } from '../../../../ducks/gasAndCollateral/gasAndCollateral.duck'
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
import { getCustomStorageLimit } from '../../../../selectors/custom-storageLimit'
import { getTxParams } from '../../../../selectors/transactions'
import { getTokenBalance } from '../../../../pages/send/send.selectors'
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util'
import {
  addHexWEIsToDec,
  subtractHexWEIsToDec,
  decEthToConvertedCurrency as ethTotalToConvertedCurrency,
  hexWEIToDecGWEI,
} from '../../../../helpers/utils/conversions.util'
import { getRenderableTimeEstimate } from '../../../../helpers/utils/gas-time-estimates.util'
import { formatETHFee } from '../../../../helpers/utils/formatters'
import {
  calcGasTotal,
  isBalanceSufficient,
} from '../../../../pages/send/send.utils'

import { getMaxModeOn } from '../../../../pages/send/send-content/send-amount-row/amount-max-button/amount-max-button.selectors'
import { calcMaxAmount } from '../../../../pages/send/send-content/send-amount-row/amount-max-button/amount-max-button.utils'

const mapStateToProps = (state, ownProps) => {
  const { selectedAddressTxList } = state.metamask
  const { modalState: { props: modalProps } = {} } = state.appState.modal || {}
  const { txData = {} } = modalProps || {}
  const { transaction = {} } = ownProps
  const selectedTransaction = selectedAddressTxList.find(
    ({ id }) => id === (transaction.id || txData.id)
  )

  const { willUserPayTxFee, willUserPayCollateral } = txData

  const buttonDataLoading = getBasicGasEstimateLoadingStatus(state)
  const gasEstimatesLoading = getGasEstimatesLoadingStatus(state)

  const {
    gasPrice: currentGasPrice,
    gas: currentGasLimit,
    storageLimit: currentStorageLimit,
    value,
    to: toAddress,
    data,
  } = getTxParams(state, selectedTransaction)
  const isSimpleTx = !(data || isValidContractAddress(toAddress))
  const customModalStorageLimitInHex =
    getCustomStorageLimit(state) || currentStorageLimit || '0x0'
  const customModalGasPriceInHex = getCustomGasPrice(state) || currentGasPrice
  const customModalGasLimitInHex =
    getCustomGasLimit(state) || currentGasLimit || '0x5208'
  const customGasTotal = calcGasTotal(
    customModalGasLimitInHex,
    customModalGasPriceInHex,
    customModalStorageLimitInHex
  )
  const customGasTotalCountSponsoredFee = calcGasTotal(
    willUserPayTxFee ? customModalGasLimitInHex : '0x0',
    customModalGasPriceInHex,
    willUserPayCollateral ? customModalStorageLimitInHex : '0x0'
  )

  const gasButtonInfo = getRenderableBasicEstimateData(
    state,
    customModalGasLimitInHex,
    customModalStorageLimitInHex
  )

  const currentCurrency = getCurrentCurrency(state)
  const conversionRate = getConversionRate(state)

  const newTotalFiat = addHexWEIsToRenderableFiat(
    value,
    customGasTotalCountSponsoredFee,
    currentCurrency,
    conversionRate
  )

  // const hideBasic = state.appState.modal.modalState.props.hideBasic

  const customGasPrice = calcCustomGasPrice(customModalGasPriceInHex)

  const maxModeOn = getMaxModeOn(state)

  const gasPrices = getEstimatedGasPrices(state)
  const estimatedTimes = getEstimatedGasTimes(state)
  const balance = getCurrentEthBalance(state)

  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)
  const showFiat = Boolean(isMainnet || showFiatInTestnets)

  const newTotalEth = maxModeOn
    ? addHexWEIsToRenderableEth(balance, '0x0')
    : addHexWEIsToRenderableEth(value, customGasTotalCountSponsoredFee)

  const sendAmount = maxModeOn
    ? subtractHexWEIsFromRenderableEth(balance, customGasTotal)
    : addHexWEIsToRenderableEth(value, '0x0')

  const sponsoredFeeHex = calcGasTotal(
    !willUserPayTxFee ? customModalGasLimitInHex : '0x0',
    customModalGasPriceInHex,
    !willUserPayCollateral ? customModalStorageLimitInHex : '0x0'
  )

  const insufficientBalance = maxModeOn
    ? false
    : !isBalanceSufficient({
      amount: value,
      gasTotal: customGasTotalCountSponsoredFee,
      balance,
      conversionRate,
    })

  return {
    hideBasic: true, // TODO: support smarter gas price estimation based on gas station
    isSimpleTx,
    isConfirm: isConfirm(state),
    customModalGasPriceInHex,
    customModalGasLimitInHex,
    customModalStorageLimitInHex,
    customGasPrice,
    customGasLimit: calcCustomGasOrStorageLimit(customModalGasLimitInHex),
    customStorageLimit: calcCustomGasOrStorageLimit(
      customModalStorageLimitInHex
    ),
    customGasTotal,
    newTotalFiat,
    currentTimeEstimate: getRenderableTimeEstimate(
      customGasPrice,
      gasPrices,
      estimatedTimes
    ),
    blockTime: getBasicGasEstimateBlockTime(state),
    customPriceIsSafe: isCustomPriceSafe(state),
    maxModeOn,
    gasPriceButtonGroupProps: {
      buttonDataLoading,
      defaultActiveButtonIndex: getDefaultActiveButtonIndex(
        gasButtonInfo,
        customModalGasPriceInHex
      ),
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
      originalTotalFiat: addHexWEIsToRenderableFiat(
        value,
        customGasTotal,
        currentCurrency,
        conversionRate
      ),
      originalTotalEth: addHexWEIsToRenderableEth(value, customGasTotal),
      newTotalFiat: showFiat ? newTotalFiat : '',
      newTotalEth,
      transactionFee: addHexWEIsToRenderableEth('0x0', customGasTotal),
      sendAmount,
      sponsoredFee: addHexWEIsToRenderableEth('0x0', sponsoredFeeHex),
    },
    transaction: txData || transaction,
    isSpeedUp: transaction.status === 'submitted',
    isRetry: transaction.status === 'failed',
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

const mapDispatchToProps = (dispatch) => {
  const updateCustomGasPrice = (newPrice) =>
    dispatch(setCustomGasPrice(addHexPrefix(newPrice)))

  return {
    cancelAndClose: () => {
      dispatch(resetCustomGasData())
      dispatch(resetCustomStorageData())
      dispatch(resetCustomGasAndCollateralData())
      dispatch(hideModal())
    },
    hideModal: () => dispatch(hideModal()),
    updateCustomGasPrice,
    updateCustomGasLimit: (newLimit) =>
      dispatch(setCustomGasLimit(addHexPrefix(newLimit))),
    updateCustomStorageLimit: (newLimit) =>
      dispatch(setCustomStorageLimit(addHexPrefix(newLimit))),
    setGasData: (newLimit, newPrice) => {
      dispatch(setGasLimit(newLimit))
      dispatch(setGasPrice(newPrice))
    },
    setStorageData: (newLimit) => {
      dispatch(setStorageLimit(newLimit))
    },
    updateConfirmTxGasAndCollateralAndCalculate: (
      gasLimit,
      gasPrice,
      storageLimit,
      updatedTx
    ) => {
      updateCustomGasPrice(gasPrice)
      dispatch(setCustomGasLimit(addHexPrefix(gasLimit.toString(16))))
      dispatch(setCustomStorageLimit(addHexPrefix(storageLimit.toString(16))))
      return dispatch(updateTransaction(updatedTx))
    },
    createSpeedUpTransaction: (txId, gasPrice) => {
      return dispatch(createSpeedUpTransaction(txId, gasPrice))
    },
    hideGasButtonGroup: () => dispatch(hideGasButtonGroup()),
    hideSidebar: () => dispatch(hideSidebar()),
    fetchGasEstimates: (blockTime) => dispatch(fetchGasEstimates(blockTime)),
    fetchBasicGasAndTimeEstimates: () =>
      dispatch(fetchBasicGasAndTimeEstimates()),
    setGasTotal: (total) => dispatch(setGasTotal(total)),
    setStorageTotal: (total) => dispatch(setStorageTotal(total)),
    setGasAndCollateralTotal: (total) =>
      dispatch(setGasAndCollateralTotal(total)),
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
    isSimpleTx,
    txId,
    isSpeedUp,
    isRetry,
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
    hideGasButtonGroup: dispatchHideGasButtonGroup,
    setGasData: dispatchSetGasData,
    setStorageData: dispatchSetStorageData,
    updateConfirmTxGasAndCollateralAndCalculate: dispatchUpdateConfirmTxGasAndCollateralAndCalculate,
    createSpeedUpTransaction: dispatchCreateSpeedUpTransaction,
    createRetryTransaction: dispatchCreateRetryTransaction,
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
    isSimpleTx: !selectedToken && isSimpleTx,
    onSubmit: (gasLimit, gasPrice, storageLimit) => {
      if (isConfirm) {
        const updatedTx = {
          ...transaction,
          txParams: {
            ...transaction.txParams,
            storageLimit,
            gas: gasLimit,
            gasPrice,
          },
        }
        dispatchUpdateConfirmTxGasAndCollateralAndCalculate(
          gasLimit,
          gasPrice,
          storageLimit,
          updatedTx
        )
        dispatchHideModal()
      } else if (isSpeedUp) {
        dispatchCreateSpeedUpTransaction(txId, gasPrice)
        dispatchHideSidebar()
        dispatchCancelAndClose()
      } else if (isRetry) {
        dispatchCreateRetryTransaction(txId, gasPrice)
        dispatchHideSidebar()
        dispatchCancelAndClose()
      } else {
        dispatchSetGasData(gasLimit, gasPrice)
        dispatchSetStorageData(storageLimit)
        dispatchHideGasButtonGroup()
        dispatchCancelAndClose()
      }
      if (maxModeOn) {
        dispatchSetAmountToMax({
          balance,
          gasAndCollateralTotal: customGasTotal,
          selectedToken,
          tokenBalance,
        })
      }
    },
    gasPriceButtonGroupProps: {
      ...gasPriceButtonGroupProps,
      handleGasPriceSelection: otherDispatchProps.updateCustomGasPrice,
    },
    cancelAndClose: () => {
      dispatchCancelAndClose()
      if (isSpeedUp || isRetry) {
        dispatchHideSidebar()
      }
    },
    disableSave:
      insufficientBalance ||
      (isSpeedUp && customGasPrice === 0) ||
      customGasLimit < 21000,
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(GasModalPageContainer)

function isConfirm (state) {
  return Boolean(Object.keys(state.confirmTransaction.txData).length)
}

function calcCustomGasPrice (customGasPriceInHex) {
  return Number(hexWEIToDecGWEI(customGasPriceInHex))
}

function calcCustomGasOrStorageLimit (customGasOrStorageLimitInHex) {
  return parseInt(customGasOrStorageLimitInHex, 16)
}

function addHexWEIsToRenderableEth (aHexWEI, bHexWEI) {
  return pipe(addHexWEIsToDec, formatETHFee)(aHexWEI, bHexWEI)
}

function subtractHexWEIsFromRenderableEth (aHexWEI, bHexWei) {
  return pipe(subtractHexWEIsToDec, formatETHFee)(aHexWEI, bHexWei)
}

function addHexWEIsToRenderableFiat (
  aHexWEI,
  bHexWEI,
  convertedCurrency,
  conversionRate
) {
  return pipe(
    addHexWEIsToDec,
    partialRight(ethTotalToConvertedCurrency, [
      convertedCurrency,
      conversionRate,
    ]),
    partialRight(formatCurrency, [convertedCurrency])
  )(aHexWEI, bHexWEI)
}
