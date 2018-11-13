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
  formatTimeEstimate,
  getAveragePriceEstimateInHexWEI,
  getFastPriceEstimateInHexWEI,
  getBasicGasEstimateLoadingStatus,
  getBasicGasEstimateBlockTime,
  getCustomGasErrors,
  getCustomGasLimit,
  getCustomGasPrice,
  getCustomGasTotal,
  getDefaultActiveButtonIndex,
  getEstimatedGasPrices,
  getEstimatedGasTimes,
  getPriceAndTimeEstimates,
  getRenderableBasicEstimateData,
  getRenderableEstimateDataForSmallButtonsFromGWEI,
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

function getPriceAndTimeEstimates (state) {
  return state.gas.priceAndTimeEstimates
}

function getEstimatedGasPrices (state) {
  return getPriceAndTimeEstimates(state).map(({ gasprice }) => gasprice)
}

function getEstimatedGasTimes (state) {
  return getPriceAndTimeEstimates(state).map(({ expectedTime }) => expectedTime)
}

function getAveragePriceEstimateInHexWEI (state) {
  const averagePriceEstimate = state.gas.basicEstimates.average
  return getGasPriceInHexWei(averagePriceEstimate || '0x0')
}

function getFastPriceEstimateInHexWEI (state, convertFromDecGWEI) {
  const fastPriceEstimate = state.gas.basicEstimates.fast
  return getGasPriceInHexWei(fastPriceEstimate || '0x0', convertFromDecGWEI)
}

function getDefaultActiveButtonIndex (gasButtonInfo, customGasPriceInHex, gasPrice) {
  return gasButtonInfo.findIndex(({ priceInHexWei }) => {
    return priceInHexWei === addHexPrefix(customGasPriceInHex || gasPrice)
  })
}

function getBasicGasEstimateBlockTime (state) {
  return state.gas.basicEstimates.blockTime
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

function getRenderableEthFee (estimate, gasLimit, numberOfDecimals = 9, convertFromDecGWEI) {
  const initialConversion = convertFromDecGWEI
    ? x => conversionUtil(x, { fromNumericBase: 'dec', toNumericBase: 'hex' })
    : apiEstimateModifiedToGWEI

  return pipe(
    initialConversion,
    partialRight(basicPriceEstimateToETHTotal, [gasLimit, numberOfDecimals]),
    formatETHFee
  )(estimate, gasLimit)
}


function getRenderableConvertedCurrencyFee (estimate, gasLimit, convertedCurrency, conversionRate, convertFromDecGWEI) {
  const initialConversion = convertFromDecGWEI
    ? x => conversionUtil(x, { fromNumericBase: 'dec', toNumericBase: 'hex' })
    : apiEstimateModifiedToGWEI

  return pipe(
    initialConversion,
    partialRight(basicPriceEstimateToETHTotal, [gasLimit]),
    partialRight(ethTotalToConvertedCurrency, [convertedCurrency, conversionRate]),
    partialRight(formatCurrency, [convertedCurrency])
  )(estimate, gasLimit, convertedCurrency, conversionRate)
}

function getTimeEstimateInSeconds (blockWaitEstimate) {
  return multiplyCurrencies(blockWaitEstimate, 60, {
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

function getRenderableTimeEstimate (blockWaitEstimate) {
  return pipe(
    getTimeEstimateInSeconds,
    formatTimeEstimate
  )(blockWaitEstimate)
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

function getGasPriceInHexWei (price, convertFromDecGWEI) {
  const initialConversion = convertFromDecGWEI
    ? x => conversionUtil(x, { fromNumericBase: 'dec', toNumericBase: 'hex' })
    : apiEstimateModifiedToGWEI

  return pipe(
    initialConversion,
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
        fast,
        fastest,
        safeLowWait,
        fastestWait,
        fastWait,
      },
    },
  } = state

  return [
    {
      labelKey: 'fastest',
      feeInPrimaryCurrency: getRenderableConvertedCurrencyFee(fastest, gasLimit, currentCurrency, conversionRate),
      feeInSecondaryCurrency: getRenderableEthFee(fastest, gasLimit),
      timeEstimate: fastestWait && getRenderableTimeEstimate(fastestWait),
      priceInHexWei: getGasPriceInHexWei(fastest),
    },
    {
      labelKey: 'fast',
      feeInPrimaryCurrency: getRenderableConvertedCurrencyFee(fast, gasLimit, currentCurrency, conversionRate),
      feeInSecondaryCurrency: getRenderableEthFee(fast, gasLimit),
      timeEstimate: fastWait && getRenderableTimeEstimate(fastWait),
      priceInHexWei: getGasPriceInHexWei(fast),
    },
    {
      labelKey: 'slow',
      feeInPrimaryCurrency: getRenderableConvertedCurrencyFee(safeLow, gasLimit, currentCurrency, conversionRate),
      feeInSecondaryCurrency: getRenderableEthFee(safeLow, gasLimit),
      timeEstimate: safeLowWait && getRenderableTimeEstimate(safeLowWait),
      priceInHexWei: getGasPriceInHexWei(safeLow),
    },
  ]
}

function getRenderableEstimateDataForSmallButtonsFromGWEI (state) {
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
        fast,
        fastest,
      },
    },
  } = state

  return [
    {
      labelKey: 'fastest',
      feeInSecondaryCurrency: getRenderableConvertedCurrencyFee(fastest, gasLimit, currentCurrency, conversionRate, true),
      feeInPrimaryCurrency: getRenderableEthFee(fastest, gasLimit, NUMBER_OF_DECIMALS_SM_BTNS, true),
      priceInHexWei: getGasPriceInHexWei(fastest, true),
    },
    {
      labelKey: 'fast',
      feeInSecondaryCurrency: getRenderableConvertedCurrencyFee(fast, gasLimit, currentCurrency, conversionRate, true),
      feeInPrimaryCurrency: getRenderableEthFee(fast, gasLimit, NUMBER_OF_DECIMALS_SM_BTNS, true),
      priceInHexWei: getGasPriceInHexWei(fast, true),
    },
    {
      labelKey: 'slow',
      feeInSecondaryCurrency: getRenderableConvertedCurrencyFee(safeLow, gasLimit, currentCurrency, conversionRate, true),
      feeInPrimaryCurrency: getRenderableEthFee(safeLow, gasLimit, NUMBER_OF_DECIMALS_SM_BTNS, true),
      priceInHexWei: getGasPriceInHexWei(safeLow, true),
    },
  ]
}
