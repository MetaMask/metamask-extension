const {
  addCurrencies,
  conversionUtil,
  conversionGTE,
  multiplyCurrencies,
  conversionGreaterThan,
} = require('../../conversion-util')
const {
  calcTokenAmount,
} = require('../../token-util')
const {
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
  NEGATIVE_ETH_ERROR,
  ONE_GWEI_IN_WEI_HEX,
  SIMPLE_GAS_COST,
} = require('./send.constants')
const abi = require('ethereumjs-abi')
const ethUtil = require('ethereumjs-util')

module.exports = {
  calcGasTotal,
  calcTokenBalance,
  doesAmountErrorRequireUpdate,
  estimateGas,
  estimateGasPriceFromRecentBlocks,
  generateTokenTransferData,
  getAmountErrorObject,
  isBalanceSufficient,
  isTokenBalanceSufficient,
}

function calcGasTotal (gasLimit, gasPrice) {
  return multiplyCurrencies(gasLimit, gasPrice, {
    toNumericBase: 'hex',
    multiplicandBase: 16,
    multiplierBase: 16,
  })
}

function isBalanceSufficient ({
  amount = '0x0',
  amountConversionRate,
  balance,
  conversionRate,
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
      conversionRate: amountConversionRate || conversionRate,
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
      fromNumericBase: 'dec',
    },
    {
      value: calcTokenAmount(amountInDec, decimals),
      fromNumericBase: 'dec',
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
  if (gasTotal && conversionRate) {
    insufficientFunds = !isBalanceSufficient({
      amount: selectedToken ? '0x0' : amount,
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

function calcTokenBalance ({ selectedToken, usersToken }) {
  const { decimals } = selectedToken || {}
  return calcTokenAmount(usersToken.balance.toString(), decimals)
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

async function estimateGas ({ selectedAddress, selectedToken, data, blockGasLimit, to, value, gasPrice, estimateGasMethod }) {
  const { symbol } = selectedToken || {}
  const paramsForGasEstimate = { from: selectedAddress, value, gasPrice }

  if (symbol) {
    Object.assign(paramsForGasEstimate, { value: '0x0' })
  }

  if (data) {
    Object.assign(paramsForGasEstimate, { data })
  }
  // if recipient has no code, gas is 21k max:
  const hasRecipient = Boolean(to)
  let code
  if (hasRecipient) code = await global.eth.getCode(to)
  if (hasRecipient && (!code || code === '0x')) {
    return SIMPLE_GAS_COST
  }

  paramsForGasEstimate.to = to

  // if not, fall back to block gasLimit
  paramsForGasEstimate.gas = ethUtil.addHexPrefix(multiplyCurrencies(blockGasLimit, 0.95, {
    multiplicandBase: 16,
    multiplierBase: 10,
    roundDown: '0',
    toNumericBase: 'hex',
  }))

  // run tx
  return new Promise((resolve, reject) => {
    estimateGasMethod(paramsForGasEstimate, (err, estimatedGas) => {
      if (err) {
        reject(err)
      }
      resolve(estimatedGas.toString(16))
    })
  })
}

function generateTokenTransferData (selectedAddress, selectedToken) {
  if (!selectedToken) return
  console.log(`abi.rawEncode`, abi.rawEncode)
  return Array.prototype.map.call(
    abi.rawEncode(['address', 'uint256'], [selectedAddress, '0x0']),
    x => ('00' + x.toString(16)).slice(-2)
  ).join('')
}

function hexComparator (a, b) {
  return conversionGreaterThan(
    { value: a, fromNumericBase: 'hex' },
    { value: b, fromNumericBase: 'hex' },
  ) ? 1 : -1
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
    return block.gasPrices
      .sort(hexComparator)[0]
  })
  .sort(hexComparator)

  return lowestPrices[Math.floor(lowestPrices.length / 2)]
}
