import BigNumber from 'bignumber.js'

export function newBigSigDig(n) {
  return new BigNumber(new BigNumber(String(n)).toPrecision(15))
}

const createOp = (a, b, op) => newBigSigDig(a)[op](newBigSigDig(b))

export function bigNumMinus(a = 0, b = 0) {
  return createOp(a, b, 'minus')
}

export function bigNumDiv(a = 0, b = 1) {
  return createOp(a, b, 'div')
}

export function extrapolateY({
  higherY = 0,
  lowerY = 0,
  higherX = 0,
  lowerX = 0,
  xForExtrapolation = 0,
}) {
  const slope = bigNumMinus(higherY, lowerY).div(bigNumMinus(higherX, lowerX))
  const newTimeEstimate = slope
    .times(bigNumMinus(higherX, xForExtrapolation))
    .minus(newBigSigDig(higherY))
    .negated()

  return newTimeEstimate.toNumber()
}

export function getAdjacentGasPrices({ gasPrices, priceToPosition }) {
  const closestLowerValueIndex = gasPrices.findIndex(
    (e, i, a) => e <= priceToPosition && a[i + 1] >= priceToPosition,
  )
  const closestHigherValueIndex = gasPrices.findIndex(
    (e) => e > priceToPosition,
  )
  return {
    closestLowerValueIndex,
    closestHigherValueIndex,
    closestHigherValue: gasPrices[closestHigherValueIndex],
    closestLowerValue: gasPrices[closestLowerValueIndex],
  }
}

export function formatTimeEstimate(totalSeconds, greaterThanMax, lessThanMin) {
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
  const formattedCombined =
    formattedMin && formattedSec
      ? `${symbol}${formattedMin} ${formattedSec}`
      : symbol + (formattedMin || formattedSec)

  return formattedCombined
}

export function getRawTimeEstimateData(
  currentGasPrice,
  gasPrices,
  estimatedTimes,
) {
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

  return {
    newTimeEstimate,
    minGasPrice,
    maxGasPrice,
  }
}

export function getRenderableTimeEstimate(
  currentGasPrice,
  gasPrices,
  estimatedTimes,
) {
  const { newTimeEstimate, minGasPrice, maxGasPrice } = getRawTimeEstimateData(
    currentGasPrice,
    gasPrices,
    estimatedTimes,
  )

  return formatTimeEstimate(
    newTimeEstimate,
    currentGasPrice > maxGasPrice,
    currentGasPrice < minGasPrice,
  )
}
