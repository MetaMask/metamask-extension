import { addHexPrefix } from 'ethereumjs-util'
import {
  conversionUtil,
  multiplyCurrencies,
  conversionGreaterThan,
} from '../helpers/utils/conversion-util'
import {
  formatCurrency,
} from '../helpers/utils/confirm-tx.util'
import {
  decEthToConvertedCurrency as ethTotalToConvertedCurrency,
} from '../helpers/utils/conversions.util'
import {
  formatETHFee,
} from '../helpers/utils/formatters'
import {
  calcGasTotal,
} from '../pages/send/send.utils'

import { GAS_ESTIMATE_TYPES } from '../helpers/constants/common'
import {
  getCurrentCurrency, getIsMainnet, getPreferences,
} from '.'

const NUMBER_OF_DECIMALS_SM_BTNS = 5

export function getCustomGasErrors (state) {
  return state.gas.errors
}

export function getCustomGasLimit (state) {
  return state.gas.customData.limit
}

export function getCustomGasPrice (state) {
  return state.gas.customData.price
}

export function getCustomGasTotal (state) {
  return state.gas.customData.total
}

export function getBasicGasEstimateLoadingStatus (state) {
  return state.gas.basicEstimateIsLoading
}

export function getGasEstimatesLoadingStatus (state) {
  return state.gas.gasEstimatesLoading
}

export function getPriceAndTimeEstimates (state) {
  return state.gas.priceAndTimeEstimates
}

export function getEstimatedGasPrices (state) {
  return getPriceAndTimeEstimates(state).map(({ gasprice }) => gasprice)
}

export function getEstimatedGasTimes (state) {
  return getPriceAndTimeEstimates(state).map(({ expectedTime }) => expectedTime)
}

export function getAveragePriceEstimateInHexWEI (state) {
  const averagePriceEstimate = state.gas.basicEstimates.average
  return getGasPriceInHexWei(averagePriceEstimate || '0x0')
}

export function getFastPriceEstimateInHexWEI (state) {
  const fastPriceEstimate = state.gas.basicEstimates.fast
  return getGasPriceInHexWei(fastPriceEstimate || '0x0')
}

export function getDefaultActiveButtonIndex (gasButtonInfo, customGasPriceInHex, gasPrice) {
  return gasButtonInfo.findIndex(({ priceInHexWei }) => {
    return priceInHexWei === addHexPrefix(customGasPriceInHex || gasPrice)
  })
}

export function getSafeLowEstimate (state) {
  const {
    gas: {
      basicEstimates: {
        safeLow,
      },
    },
  } = state

  return safeLow
}

export function isCustomPriceSafe (state) {
  const safeLow = getSafeLowEstimate(state)
  const customGasPrice = getCustomGasPrice(state)

  if (!customGasPrice) {
    return true
  }

  if (safeLow === null) {
    return null
  }

  const customPriceSafe = conversionGreaterThan(
    {
      value: customGasPrice,
      fromNumericBase: 'hex',
      fromDenomination: 'WEI',
      toDenomination: 'GWEI',
    },
    { value: safeLow, fromNumericBase: 'dec' },
  )

  return customPriceSafe
}

export function getBasicGasEstimateBlockTime (state) {
  return state.gas.basicEstimates.blockTime
}

export function basicPriceEstimateToETHTotal (estimate, gasLimit, numberOfDecimals = 9) {
  return conversionUtil(calcGasTotal(gasLimit, estimate), {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'GWEI',
    numberOfDecimals,
  })
}

export function getRenderableEthFee (estimate, gasLimit, numberOfDecimals = 9) {
  const value = conversionUtil(estimate, { fromNumericBase: 'dec', toNumericBase: 'hex' })
  const fee = basicPriceEstimateToETHTotal(value, gasLimit, numberOfDecimals)
  return formatETHFee(fee)
}

export function getRenderableConvertedCurrencyFee (estimate, gasLimit, convertedCurrency, conversionRate) {
  const value = conversionUtil(estimate, { fromNumericBase: 'dec', toNumericBase: 'hex' })
  const fee = basicPriceEstimateToETHTotal(value, gasLimit)
  const feeInCurrency = ethTotalToConvertedCurrency(fee, convertedCurrency, conversionRate)
  return formatCurrency(feeInCurrency, convertedCurrency)
}

export function getTimeEstimateInSeconds (blockWaitEstimate) {
  return multiplyCurrencies(blockWaitEstimate, 60, {
    toNumericBase: 'dec',
    multiplicandBase: 10,
    multiplierBase: 10,
    numberOfDecimals: 1,
  })
}

export function formatTimeEstimate (totalSeconds, greaterThanMax, lessThanMin) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)

  if (!minutes && !seconds) {
    return '...'
  }

  let symbol = '~'
  if (greaterThanMax) {
    symbol = '< '
  } else if (lessThanMin) {
    symbol = '> '
  }

  const formattedMin = `${minutes ? `${minutes} min` : ''}`
  const formattedSec = `${seconds ? `${seconds} sec` : ''}`
  const formattedCombined = formattedMin && formattedSec
    ? `${symbol}${formattedMin} ${formattedSec}`
    : symbol + [formattedMin, formattedSec].find((t) => t)

  return formattedCombined
}

export function getRenderableTimeEstimate (blockWaitEstimate) {
  return formatTimeEstimate(getTimeEstimateInSeconds(blockWaitEstimate))
}

export function priceEstimateToWei (priceEstimate) {
  return conversionUtil(priceEstimate, {
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
    numberOfDecimals: 9,
  })
}

export function getGasPriceInHexWei (price) {
  const value = conversionUtil(price, { fromNumericBase: 'dec', toNumericBase: 'hex' })
  return addHexPrefix(priceEstimateToWei(value))
}

export function getRenderableBasicEstimateData (state, gasLimit) {
  if (getBasicGasEstimateLoadingStatus(state)) {
    return []
  }

  const { showFiatInTestnets } = getPreferences(state)
  const isMainnet = getIsMainnet(state)
  const showFiat = (isMainnet || Boolean(showFiatInTestnets))
  const { conversionRate } = state.metamask
  const currentCurrency = getCurrentCurrency(state)
  const {
    gas: {
      basicEstimates: {
        safeLow,
        average,
        fast,
        safeLowWait,
        avgWait,
        fastWait,
      },
    },
  } = state

  return [
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.SLOW,
      feeInPrimaryCurrency: getRenderableEthFee(safeLow, gasLimit),
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(safeLow, gasLimit, currentCurrency, conversionRate)
        : '',
      timeEstimate: safeLowWait && getRenderableTimeEstimate(safeLowWait),
      priceInHexWei: getGasPriceInHexWei(safeLow),
    },
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.AVERAGE,
      feeInPrimaryCurrency: getRenderableEthFee(average, gasLimit),
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(average, gasLimit, currentCurrency, conversionRate)
        : '',
      timeEstimate: avgWait && getRenderableTimeEstimate(avgWait),
      priceInHexWei: getGasPriceInHexWei(average),
    },
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.FAST,
      feeInPrimaryCurrency: getRenderableEthFee(fast, gasLimit),
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(fast, gasLimit, currentCurrency, conversionRate)
        : '',
      timeEstimate: fastWait && getRenderableTimeEstimate(fastWait),
      priceInHexWei: getGasPriceInHexWei(fast),
    },
  ]
}

export function getRenderableEstimateDataForSmallButtonsFromGWEI (state) {
  if (getBasicGasEstimateLoadingStatus(state)) {
    return []
  }

  const { showFiatInTestnets } = getPreferences(state)
  const isMainnet = getIsMainnet(state)
  const showFiat = (isMainnet || Boolean(showFiatInTestnets))
  const gasLimit = state.metamask.send.gasLimit || getCustomGasLimit(state) || '0x5208'
  const { conversionRate } = state.metamask
  const currentCurrency = getCurrentCurrency(state)
  const {
    gas: {
      basicEstimates: {
        safeLow,
        average,
        fast,
      },
    },
  } = state

  return [
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.SLOW,
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(safeLow, gasLimit, currentCurrency, conversionRate)
        : '',
      feeInPrimaryCurrency: getRenderableEthFee(safeLow, gasLimit, NUMBER_OF_DECIMALS_SM_BTNS, true),
      priceInHexWei: getGasPriceInHexWei(safeLow, true),
    },
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.AVERAGE,
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(average, gasLimit, currentCurrency, conversionRate)
        : '',
      feeInPrimaryCurrency: getRenderableEthFee(average, gasLimit, NUMBER_OF_DECIMALS_SM_BTNS, true),
      priceInHexWei: getGasPriceInHexWei(average, true),
    },
    {
      gasEstimateType: GAS_ESTIMATE_TYPES.FAST,
      feeInSecondaryCurrency: showFiat
        ? getRenderableConvertedCurrencyFee(fast, gasLimit, currentCurrency, conversionRate)
        : '',
      feeInPrimaryCurrency: getRenderableEthFee(fast, gasLimit, NUMBER_OF_DECIMALS_SM_BTNS, true),
      priceInHexWei: getGasPriceInHexWei(fast, true),
    },
  ]
}
