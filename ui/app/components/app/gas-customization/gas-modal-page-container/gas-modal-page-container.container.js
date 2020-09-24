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
  calcGasAndCollateralTotal,
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

  const buttonDataLoading = getBasicGasEstimateLoadingStatus(state)
  const gasEstimatesLoading = getGasEstimatesLoadingStatus(state)
  const txParams = getTxParams(state, selectedTransaction)

  const {
    gasPrice: currentGasPrice,
    gas: currentGasLimit,
    storageLimit: currentStorageLimit,
    value,
    to: toAddress,
    data,
  } = txParams
  let { willUserPayTxFee, willUserPayCollateral } = selectedTransaction

  if (willUserPayTxFee === undefined) {
    willUserPayTxFee = txData.willUserPayTxFee
    willUserPayCollateral = txData.willUserPayCollateral
  }

  const isSimpleTx = !(data || isValidContractAddress(toAddress))
  const customModalStorageLimitInHex =
    getCustomStorageLimit(state) || currentStorageLimit || '0x0'
  const customModalGasPriceInHex = getCustomGasPrice(state) || currentGasPrice
  const customModalGasLimitInHex =
    getCustomGasLimit(state) || currentGasLimit || '0x5208'
  const customGasAndCollateralTotal = calcGasAndCollateralTotal(
    customModalGasLimitInHex,
    customModalGasPriceInHex,
    customModalStorageLimitInHex
  )
  const customGasAndCollateralTotalCountSponsoredFee = calcGasAndCollateralTotal(
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
    customGasAndCollateralTotalCountSponsoredFee,
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
    : addHexWEIsToRenderableEth(
      value,
      customGasAndCollateralTotalCountSponsoredFee
    )

  const sendAmount = maxModeOn
    ? subtractHexWEIsFromRenderableEth(
      balance,
      customGasAndCollateralTotalCountSponsoredFee
    )
    : addHexWEIsToRenderableEth(value, '0x0')

  const sponsoredFeeHex = calcGasAndCollateralTotal(
    !willUserPayTxFee ? customModalGasLimitInHex : '0x0',
    customModalGasPriceInHex,
    !willUserPayCollateral ? customModalStorageLimitInHex : '0x0'
  )

  const insufficientBalance = maxModeOn
    ? false
    : !isBalanceSufficient({
      amount: value,
      gasTotal: customGasAndCollateralTotalCountSponsoredFee,
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
    customGasAndCollateralTotal,
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
        customGasAndCollateralTotalCountSponsoredFee,
        currentCurrency,
        conversionRate
      ),
      originalTotalEth: addHexWEIsToRenderableEth(
        value,
        customGasAndCollateralTotalCountSponsoredFee
      ),
      newTotalFiat: showFiat ? newTotalFiat : '',
      newTotalEth,
      transactionFee: addHexWEIsToRenderableEth(
        '0x0',
        customGasAndCollateralTotal
      ),
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
    customGasAndCollateralTotal,
    balance,
    selectedToken,
    tokenBalance,
    customGasPrice,
    customGasLimit,
    customModalGasPriceInHex,
    customModalGasLimitInHex,
    customModalStorageLimitInHex,
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

  const onSubmit = (gasLimit, gasPrice, storageLimit, noHideModal) => {
    if (!gasPrice) {
      gasPrice = customModalGasPriceInHex
    }
    if (!gasLimit) {
      gasLimit = customModalGasLimitInHex
    }
    if (!storageLimit) {
      storageLimit = customModalStorageLimitInHex
    }
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
      if (!noHideModal) {
        dispatchHideModal()
      }
    } else if (isSpeedUp) {
      dispatchCreateSpeedUpTransaction(txId, gasPrice)
      dispatchHideSidebar()
      if (!noHideModal) {
        dispatchCancelAndClose()
      }
    } else if (isRetry) {
      dispatchCreateRetryTransaction(txId, gasPrice)
      dispatchHideSidebar()
      if (!noHideModal) {
        dispatchCancelAndClose()
      }
    } else {
      dispatchSetGasData(gasLimit, gasPrice)
      dispatchSetStorageData(storageLimit)
      dispatchHideGasButtonGroup()
      if (!noHideModal) {
        dispatchCancelAndClose()
      }
    }
    if (maxModeOn) {
      dispatchSetAmountToMax({
        balance,
        gasAndCollateralTotal: customGasAndCollateralTotal,
        selectedToken,
        tokenBalance,
      })
    }
  }

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    isSimpleTx: !selectedToken && isSimpleTx,
    updateCustomGasLimit: (gasLimit) => {
      onSubmit(gasLimit, null, null, true)
    },
    updateCustomGasPrice: (gasPrice) => {
      onSubmit(null, gasPrice, null, true)
    },
    updateCustomStorageLimit: (storageLimit) => {
      onSubmit(null, null, storageLimit, true)
    },
    onSubmit,
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
