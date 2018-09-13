import { pipe, partialRight } from 'ramda'
import {
  conversionUtil,
  multiplyCurrencies,
} from '../conversion-util'
import {
  getCurrentCurrency,
} from '../selectors'
import {
  formatCurrency,
} from '../helpers/confirm-transaction/util'
import {
  decEthToConvertedCurrency as ethTotalToConvertedCurrency,
} from '../helpers/conversions.util'
import {
  formatETHFee,
} from '../helpers/formatters'
import {
  calcGasTotal,
} from '../components/send/send.utils'
import { addHexPrefix } from 'ethereumjs-util'

const selectors = {
  getCustomGasErrors,
  getCustomGasLimit,
  getCustomGasPrice,
  getCustomGasTotal,
  getRenderableEstimateDataForSmallButtons,
  getRenderableBasicEstimateData,
  getBasicGasEstimateLoadingStatus,
  getAveragePriceEstimateInHexWEI,
  getDefaultActiveButtonIndex,
  priceEstimateToWei,
}

module.exports = selectors

const NUMBER_OF_DECIMALS_SM_BTNS = 5

function getCustomGasErrors (state) {
  return state.gas.errors
}

function getCustomGasLimit (state) {
  return state.gas.customData.limit
}

function getCustomGasPrice (state) {
  return state.gas.customData.price
}

function getCustomGasTotal (state) {
  return state.gas.customData.total
}

function getBasicGasEstimateLoadingStatus (state) {
  return state.gas.basicEstimateIsLoading
}

function getAveragePriceEstimateInHexWEI (state) {
  const averagePriceEstimate = state.gas.basicEstimates.average
  return getGasPriceInHexWei(averagePriceEstimate || '0x0')
}

function getDefaultActiveButtonIndex (gasButtonInfo, customGasPriceInHex, gasPrice) {
  console.log('gasButtonInfo', gasButtonInfo)
  return gasButtonInfo.findIndex(({ priceInHexWei }) => {
    console.log('priceInHexWei', priceInHexWei, '|', customGasPriceInHex)
    return priceInHexWei === addHexPrefix(customGasPriceInHex || gasPrice)
  })
}

function apiEstimateModifiedToGWEI (estimate) {
  return multiplyCurrencies(estimate, 0.10, {
    toNumericBase: 'hex',
    multiplicandBase: 10,
    multiplierBase: 10,
    numberOfDecimals: 9,
  })
}

function basicPriceEstimateToETHTotal (estimate, gasLimit, numberOfDecimals = 9) {
  return conversionUtil(calcGasTotal(gasLimit, estimate), {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'GWEI',
    numberOfDecimals,
  })
}

function getRenderableEthFee (estimate, gasLimit, numberOfDecimals = 9) {
  return pipe(
    apiEstimateModifiedToGWEI,
    partialRight(basicPriceEstimateToETHTotal, [gasLimit, numberOfDecimals]),
    formatETHFee
  )(estimate, gasLimit)
}


function getRenderableConvertedCurrencyFee (estimate, gasLimit, convertedCurrency, conversionRate) {
  return pipe(
    apiEstimateModifiedToGWEI,
    partialRight(basicPriceEstimateToETHTotal, [gasLimit]),
    partialRight(ethTotalToConvertedCurrency, [convertedCurrency, conversionRate]),
    partialRight(formatCurrency, [convertedCurrency])
  )(estimate, gasLimit, convertedCurrency, conversionRate)
}

function getTimeEstimateInSeconds (blockWaitEstimate, currentBlockTime) {
  return multiplyCurrencies(blockWaitEstimate, currentBlockTime, {
    toNumericBase: 'dec',
    multiplicandBase: 10,
    multiplierBase: 10,
    numberOfDecimals: 1,
  })
}

function formatTimeEstimate (totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const formattedMin = `${minutes ? minutes + ' min' : ''}`
  const formattedSec = `${seconds ? seconds + ' sec' : ''}`
  const formattedCombined = formattedMin && formattedSec
    ? `~${formattedMin} ${formattedSec}`
    : '~' + [formattedMin, formattedSec].find(t => t)

  return formattedCombined
}

function getRenderableTimeEstimate (blockWaitEstimate, currentBlockTime) {
  return pipe(
    getTimeEstimateInSeconds,
    formatTimeEstimate
  )(blockWaitEstimate, currentBlockTime)
}

function priceEstimateToWei (priceEstimate) {
  return conversionUtil(priceEstimate, {
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
    numberOfDecimals: 9,
  })
}

function getGasPriceInHexWei (price) {
  return pipe(
    apiEstimateModifiedToGWEI,
    priceEstimateToWei,
    addHexPrefix
  )(price)
}

function getRenderableBasicEstimateData (state) {
  if (getBasicGasEstimateLoadingStatus(state)) {
    return []
  }
  const gasLimit = state.metamask.send.gasLimit || getCustomGasLimit(state)
  const conversionRate = state.metamask.conversionRate
  const currentCurrency = getCurrentCurrency(state)
  const {
    gas: {
      basicEstimates: {
        safeLow,
        average,
        fast,
        blockTime,
        safeLowWait,
        avgWait,
        fastWait,
      },
    },
  } = state

  return [
    {
      feeInPrimaryCurrency: getRenderableConvertedCurrencyFee(fast, gasLimit, currentCurrency, conversionRate),
      feeInSecondaryCurrency: getRenderableEthFee(fast, gasLimit),
      timeEstimate: getRenderableTimeEstimate(fastWait, blockTime),
      priceInHexWei: getGasPriceInHexWei(fast),
    },
    {
      feeInPrimaryCurrency: getRenderableConvertedCurrencyFee(average, gasLimit, currentCurrency, conversionRate),
      feeInSecondaryCurrency: getRenderableEthFee(average, gasLimit),
      timeEstimate: getRenderableTimeEstimate(avgWait, blockTime),
      priceInHexWei: getGasPriceInHexWei(average),
    },
    {
      feeInPrimaryCurrency: getRenderableConvertedCurrencyFee(safeLow, gasLimit, currentCurrency, conversionRate),
      feeInSecondaryCurrency: getRenderableEthFee(safeLow, gasLimit),
      timeEstimate: getRenderableTimeEstimate(safeLowWait, blockTime),
      priceInHexWei: getGasPriceInHexWei(safeLow),
    },
  ]
}

function getRenderableEstimateDataForSmallButtons (state) {
  if (getBasicGasEstimateLoadingStatus(state)) {
    return []
  }
  const gasLimit = state.metamask.send.gasLimit || getCustomGasLimit(state)
  const conversionRate = state.metamask.conversionRate
  const currentCurrency = getCurrentCurrency(state)
  const {
    gas: {
      basicEstimates: {
        safeLow,
        average,
        fast,
        blockTime,
        safeLowWait,
        avgWait,
        fastWait,
      },
    },
  } = state

  return [
    {
      labelKey: 'fast',
      feeInSecondaryCurrency: getRenderableConvertedCurrencyFee(fast, gasLimit, currentCurrency, conversionRate),
      feeInPrimaryCurrency: getRenderableEthFee(fast, gasLimit, NUMBER_OF_DECIMALS_SM_BTNS),
      priceInHexWei: getGasPriceInHexWei(fast),
    },
    {
      labelKey: 'average',
      feeInSecondaryCurrency: getRenderableConvertedCurrencyFee(average, gasLimit, currentCurrency, conversionRate),
      feeInPrimaryCurrency: getRenderableEthFee(average, gasLimit, NUMBER_OF_DECIMALS_SM_BTNS),
      priceInHexWei: getGasPriceInHexWei(average),
    },
    {
      labelKey: 'slow',
      feeInSecondaryCurrency: getRenderableConvertedCurrencyFee(safeLow, gasLimit, currentCurrency, conversionRate),
      feeInPrimaryCurrency: getRenderableEthFee(safeLow, gasLimit, NUMBER_OF_DECIMALS_SM_BTNS),
      priceInHexWei: getGasPriceInHexWei(safeLow),
    },
  ]
}
