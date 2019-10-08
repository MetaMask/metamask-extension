const {
  addCurrencies,
  conversionUtil,
  conversionGTE,
  multiplyCurrencies,
  conversionGreaterThan,
  conversionLessThan,
} = require('../../helpers/utils/conversion-util')
const {
  calcTokenAmount,
} = require('../../helpers/utils/token-util')
const {
  BASE_TOKEN_GAS_COST,
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
  MIN_GAS_LIMIT_HEX,
  NEGATIVE_ETH_ERROR,
  ONE_GWEI_IN_WEI_HEX,
  SIMPLE_GAS_COST,
  TOKEN_TRANSFER_FUNCTION_SIGNATURE,
} = require('./send.constants')
const abi = require('ethereumjs-abi')
const ethUtil = require('ethereumjs-util')

module.exports = {
  addGasBuffer,
  calcGasTotal,
  calcTokenBalance,
  doesAmountErrorRequireUpdate,
  estimateGas,
  estimateGasPriceFromRecentBlocks,
  generateTokenTransferData,
  getAmountErrorObject,
  getGasFeeErrorObject,
  getToAddressForGasUpdate,
  isBalanceSufficient,
  isTokenBalanceSufficient,
  removeLeadingZeroes,
  ellipsify,
}

function calcGasTotal (gasLimit = '0', gasPrice = '0') {
  return multiplyCurrencies(gasLimit, gasPrice, {
    toNumericBase: 'hex',
    multiplicandBase: 16,
    multiplierBase: 16,
  })
}

function isBalanceSufficient ({
  amount = '0x0',
  amountConversionRate = 1,
  balance = '0x0',
  conversionRate = 1,
  gasTotal = '0x0',
  primaryCurrency,
}) {
  const totalAmount = addCurrencies(amount, gasTotal, {
    aBase: 16,
    bBase: 16,
    toNumericBase: 'hex',
  })

  const balanceIsSufficient = conversionGTE(
    {
      value: balance,
      fromNumericBase: 'hex',
      fromCurrency: primaryCurrency,
      conversionRate,
    },
    {
      value: totalAmount,
      fromNumericBase: 'hex',
      conversionRate: Number(amountConversionRate) || conversionRate,
      fromCurrency: primaryCurrency,
    },
  )

  return balanceIsSufficient
}

function isTokenBalanceSufficient ({
  amount = '0x0',
  tokenBalance,
  decimals,
}) {
  const amountInDec = conversionUtil(amount, {
    fromNumericBase: 'hex',
  })

  const tokenBalanceIsSufficient = conversionGTE(
    {
      value: tokenBalance,
      fromNumericBase: 'hex',
    },
    {
      value: calcTokenAmount(amountInDec, decimals),
    },
  )

  return tokenBalanceIsSufficient
}

function getAmountErrorObject ({
  amount,
  amountConversionRate,
  balance,
  conversionRate,
  gasTotal,
  primaryCurrency,
  selectedToken,
  tokenBalance,
}) {
  let insufficientFunds = false
  if (gasTotal && conversionRate && !selectedToken) {
    insufficientFunds = !isBalanceSufficient({
      amount,
      amountConversionRate,
      balance,
      conversionRate,
      gasTotal,
      primaryCurrency,
    })
  }

  let inSufficientTokens = false
  if (selectedToken && tokenBalance !== null) {
    const { decimals } = selectedToken
    inSufficientTokens = !isTokenBalanceSufficient({
      tokenBalance,
      amount,
      decimals,
    })
  }

  const amountLessThanZero = conversionGreaterThan(
    { value: 0, fromNumericBase: 'dec' },
    { value: amount, fromNumericBase: 'hex' },
  )

  let amountError = null

  if (insufficientFunds) {
    amountError = INSUFFICIENT_FUNDS_ERROR
  } else if (inSufficientTokens) {
    amountError = INSUFFICIENT_TOKENS_ERROR
  } else if (amountLessThanZero) {
    amountError = NEGATIVE_ETH_ERROR
  }

  return { amount: amountError }
}

function getGasFeeErrorObject ({
  amountConversionRate,
  balance,
  conversionRate,
  gasTotal,
  primaryCurrency,
}) {
  let gasFeeError = null

  if (gasTotal && conversionRate) {
    const insufficientFunds = !isBalanceSufficient({
      amount: '0x0',
      amountConversionRate,
      balance,
      conversionRate,
      gasTotal,
      primaryCurrency,
    })

    if (insufficientFunds) {
      gasFeeError = INSUFFICIENT_FUNDS_ERROR
    }
  }

  return { gasFee: gasFeeError }
}

function calcTokenBalance ({ selectedToken, usersToken }) {
  const { decimals } = selectedToken || {}
  return calcTokenAmount(usersToken.balance.toString(), decimals).toString(16)
}

function doesAmountErrorRequireUpdate ({
  balance,
  gasTotal,
  prevBalance,
  prevGasTotal,
  prevTokenBalance,
  selectedToken,
  tokenBalance,
}) {
  const balanceHasChanged = balance !== prevBalance
  const gasTotalHasChange = gasTotal !== prevGasTotal
  const tokenBalanceHasChanged = selectedToken && tokenBalance !== prevTokenBalance
  const amountErrorRequiresUpdate = balanceHasChanged || gasTotalHasChange || tokenBalanceHasChanged

  return amountErrorRequiresUpdate
}

async function estimateGas ({
  selectedAddress,
  selectedToken,
  blockGasLimit = MIN_GAS_LIMIT_HEX,
  to,
  value,
  data,
  gasPrice,
  estimateGasMethod,
}) {
  const paramsForGasEstimate = { from: selectedAddress, value, gasPrice }

  // if recipient has no code, gas is 21k max:
  if (!selectedToken && !data) {
    const code = Boolean(to) && await global.eth.getCode(to)
    // Geth will return '0x', and ganache-core v2.2.1 will return '0x0'
    const codeIsEmpty = !code || code === '0x' || code === '0x0'
    if (codeIsEmpty) {
      return SIMPLE_GAS_COST
    }
  } else if (selectedToken && !to) {
    return BASE_TOKEN_GAS_COST
  }

  if (selectedToken) {
    paramsForGasEstimate.value = '0x0'
    paramsForGasEstimate.data = generateTokenTransferData({ toAddress: to, amount: value, selectedToken })
    paramsForGasEstimate.to = selectedToken.address
  } else {
    if (data) {
      paramsForGasEstimate.data = data
    }

    if (to) {
      paramsForGasEstimate.to = to
    }

    if (!value || value === '0') {
      paramsForGasEstimate.value = '0xff'
    }
  }

  // if not, fall back to block gasLimit
  if (!blockGasLimit) {
    blockGasLimit = MIN_GAS_LIMIT_HEX
  }

  paramsForGasEstimate.gas = ethUtil.addHexPrefix(multiplyCurrencies(blockGasLimit, 0.95, {
    multiplicandBase: 16,
    multiplierBase: 10,
    roundDown: '0',
    toNumericBase: 'hex',
  }))

  // run tx
  return new Promise((resolve, reject) => {
    return estimateGasMethod(paramsForGasEstimate, (err, estimatedGas) => {
      if (err) {
        const simulationFailed = (
          err.message.includes('Transaction execution error.') ||
          err.message.includes('gas required exceeds allowance or always failing transaction')
        )
        if (simulationFailed) {
          const estimateWithBuffer = addGasBuffer(paramsForGasEstimate.gas, blockGasLimit, 1.5)
          return resolve(ethUtil.addHexPrefix(estimateWithBuffer))
        } else {
          return reject(err)
        }
      }
      const estimateWithBuffer = addGasBuffer(estimatedGas.toString(16), blockGasLimit, 1.5)
      return resolve(ethUtil.addHexPrefix(estimateWithBuffer))
    })
  })
}

function addGasBuffer (initialGasLimitHex, blockGasLimitHex, bufferMultiplier = 1.5) {
  const upperGasLimit = multiplyCurrencies(blockGasLimitHex, 0.9, {
    toNumericBase: 'hex',
    multiplicandBase: 16,
    multiplierBase: 10,
    numberOfDecimals: '0',
  })
  const bufferedGasLimit = multiplyCurrencies(initialGasLimitHex, bufferMultiplier, {
    toNumericBase: 'hex',
    multiplicandBase: 16,
    multiplierBase: 10,
    numberOfDecimals: '0',
  })

  // if initialGasLimit is above blockGasLimit, dont modify it
  if (conversionGreaterThan(
    { value: initialGasLimitHex, fromNumericBase: 'hex' },
    { value: upperGasLimit, fromNumericBase: 'hex' },
  )) return initialGasLimitHex
  // if bufferedGasLimit is below blockGasLimit, use bufferedGasLimit
  if (conversionLessThan(
    { value: bufferedGasLimit, fromNumericBase: 'hex' },
    { value: upperGasLimit, fromNumericBase: 'hex' },
  )) return bufferedGasLimit
  // otherwise use blockGasLimit
  return upperGasLimit
}

function generateTokenTransferData ({ toAddress = '0x0', amount = '0x0', selectedToken }) {
  if (!selectedToken) return
  return TOKEN_TRANSFER_FUNCTION_SIGNATURE + Array.prototype.map.call(
    abi.rawEncode(['address', 'uint256'], [toAddress, ethUtil.addHexPrefix(amount)]),
    x => ('00' + x.toString(16)).slice(-2)
  ).join('')
}

function estimateGasPriceFromRecentBlocks (recentBlocks) {
  // Return 1 gwei if no blocks have been observed:
  if (!recentBlocks || recentBlocks.length === 0) {
    return ONE_GWEI_IN_WEI_HEX
  }

  const lowestPrices = recentBlocks.map((block) => {
    if (!block.gasPrices || block.gasPrices.length < 1) {
      return ONE_GWEI_IN_WEI_HEX
    }
    return block.gasPrices.reduce((currentLowest, next) => {
      return parseInt(next, 16) < parseInt(currentLowest, 16) ? next : currentLowest
    })
  })
    .sort((a, b) => parseInt(a, 16) > parseInt(b, 16) ? 1 : -1)

  return lowestPrices[Math.floor(lowestPrices.length / 2)]
}

function getToAddressForGasUpdate (...addresses) {
  return [...addresses, ''].find(str => str !== undefined && str !== null).toLowerCase()
}

function removeLeadingZeroes (str) {
  return str.replace(/^0*(?=\d)/, '')
}

function ellipsify (text, first = 6, last = 4) {
  return `${text.slice(0, first)}...${text.slice(-last)}`
}
