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
} = require('./send.constants')
const abi = require('ethereumjs-abi')

module.exports = {
  calcGasTotal,
  doesAmountErrorRequireUpdate,
  generateTokenTransferData,
  getAmountErrorObject,
  getParamsForGasEstimate,
  calcTokenBalance,
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

function getParamsForGasEstimate (selectedAddress, symbol, data) {
  const estimatedGasParams = {
    from: selectedAddress,
    gas: '746a528800',
  }

  if (symbol) {
    Object.assign(estimatedGasParams, { value: '0x0' })
  }

  if (data) {
    Object.assign(estimatedGasParams, { data })
  }

  return estimatedGasParams
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

function generateTokenTransferData (selectedAddress, selectedToken) {
  if (!selectedToken) return
  console.log(`abi.rawEncode`, abi.rawEncode)
  return Array.prototype.map.call(
    abi.rawEncode(['address', 'uint256'], [selectedAddress, '0x0']),
    x => ('00' + x.toString(16)).slice(-2)
  ).join('')
}
