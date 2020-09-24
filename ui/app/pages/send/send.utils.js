import {
  addCurrencies,
  conversionUtil,
  conversionGTE,
  multiplyCurrencies,
  conversionGreaterThan,
  conversionLessThan,
} from '../../helpers/utils/conversion-util'

import { calcTokenAmount } from '../../helpers/utils/token-util'

import {
  BASE_TOKEN_GAS_COST,
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
  MIN_GAS_LIMIT_HEX,
  MAX_GAS_LIMIT_HEX,
  NEGATIVE_ETH_ERROR,
  SIMPLE_GAS_COST,
  SIMPLE_STORAGE_COST,
  TOKEN_TRANSFER_FUNCTION_SIGNATURE,
} from './send.constants'

import { storageToDrip as calcStorageTotal } from '../../helpers/utils/storage-util'

import abi from 'ethereumjs-abi'

import { addHexPrefix } from 'cfx-util'

export {
  addGasBuffer,
  calcGasTotal,
  calcStorageTotal,
  calcGasAndCollateralTotal,
  calcTokenBalance,
  doesAmountErrorRequireUpdate,
  checkSponsorshipInfo,
  estimateGasAndCollateral,
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

function calcGasAndCollateralTotal (
  gasLimit = '0',
  gasPrice = '0',
  storageLimit = '0',
  gasTotal,
  storageTotal
) {
  if (gasTotal !== undefined && storageTotal !== undefined) {
    return addCurrencies(addHexPrefix(gasTotal), addHexPrefix(storageTotal), {
      aBase: 16,
      bBase: 16,
      toNumericBase: 'hex',
    })
  }
  return addCurrencies(
    addHexPrefix(calcGasTotal(gasLimit, gasPrice)),
    addHexPrefix(calcStorageTotal(storageLimit)),
    {
      aBase: 16,
      bBase: 16,
      toNumericBase: 'hex',
    }
  )
}

function isBalanceSufficient ({
  amount = '0x0',
  amountConversionRate = 1,
  balance = '0x0',
  conversionRate = 1,
  // gasAndCollateralTotal = '0x0',
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
    }
  )

  return balanceIsSufficient
}

function isTokenBalanceSufficient ({ amount = '0x0', tokenBalance, decimals }) {
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
    }
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
    { value: amount, fromNumericBase: 'hex' }
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
  let gasAndCollateralFeeError = null

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
      gasAndCollateralFeeError = INSUFFICIENT_FUNDS_ERROR
    }
  }

  return { gasAndCollateralFee: gasAndCollateralFeeError }
}

function calcTokenBalance ({ selectedToken, usersToken }) {
  const { decimals } = selectedToken || {}
  return calcTokenAmount(usersToken.balance.toString(), decimals).toString(16)
}

function doesAmountErrorRequireUpdate ({
  balance,
  storageTotal,
  prevStorageTotal,
  gasTotal,
  prevBalance,
  prevGasTotal,
  prevTokenBalance,
  selectedToken,
  tokenBalance,
  sponsorshipInfoIsLoading,
  prevSponsorshipInfoIsLoading,
}) {
  const balanceHasChanged = balance !== prevBalance
  const gasTotalHasChange = gasTotal !== prevGasTotal
  const storageTotalHasChange = storageTotal !== prevStorageTotal
  const tokenBalanceHasChanged =
    selectedToken && tokenBalance !== prevTokenBalance
  const sponsorshipInfoIsLoadingChanged =
    sponsorshipInfoIsLoading !== prevSponsorshipInfoIsLoading
  const amountErrorRequiresUpdate =
    balanceHasChanged ||
    gasTotalHasChange ||
    tokenBalanceHasChanged ||
    storageTotalHasChange ||
    sponsorshipInfoIsLoadingChanged

  return amountErrorRequiresUpdate
}

async function checkSponsorshipInfo ({
  selectedAddress,
  selectedToken,
  gasLimit,
  gasPrice,
  storageLimit,
  checkSponsorshipInfoMethod,
}) {
  const defaultRst = {
    isUserBalanceEnough: true,
    willUserPayCollateral: true,
    willUserPayTxFee: true,
  }

  if (!selectedToken) {
    return defaultRst
  }

  return new Promise((resolve) => {
    return checkSponsorshipInfoMethod(
      [
        selectedAddress,
        selectedToken.address,
        gasLimit,
        gasPrice,
        storageLimit,
      ],
      (err, result) => {
        if (err) {
          resolve(defaultRst)
        }
        const { isBalanceEnough, willPayCollateral, willPayTxFee } = result
        resolve({
          isUserBalanceEnough: isBalanceEnough,
          willUserPayCollateral: willPayCollateral,
          willUserPayTxFee: willPayTxFee,
        })
      }
    )
  })
}

async function estimateGasAndCollateral ({
  selectedAddress,
  selectedToken,
  blockGasLimit = MIN_GAS_LIMIT_HEX,
  to,
  value,
  data,
  gasPrice,
  estimateGasAndCollateralMethod,
}) {
  const result = {}
  const paramsForEstimate = { from: selectedAddress, value, gasPrice }

  // if recipient has no code, gas is 21k max:
  // 0x1 account address
  // 0x8 contract address
  if (!selectedToken && !data) {
    if (!to || to[2] === '1') {
      result.gas = SIMPLE_GAS_COST
      result.storageLimit = SIMPLE_STORAGE_COST
      return result
    }
  } else if (selectedToken && !to) {
    result.gas = BASE_TOKEN_GAS_COST
  }

  if (selectedToken || data || to) {
    if (selectedToken) {
      paramsForEstimate.value = '0x0'
      paramsForEstimate.data = generateTokenTransferData({
        toAddress: to,
        amount: value,
        selectedToken,
      })
      paramsForEstimate.to = selectedToken.address
    } else {
      if (data) {
        paramsForEstimate.data = data
      }

      if (to) {
        paramsForEstimate.to = to
      }

      if (!value || value === '0') {
        paramsForEstimate.value = '0xff'
      }
    }

    // if not, fall back to block gasLimit
    if (!blockGasLimit && to) {
      blockGasLimit = MIN_GAS_LIMIT_HEX
    } else if (
      parseInt(blockGasLimit) > parseInt(`0x{MAX_GAS_LIMIT_HEX}`) &&
      to
    ) {
      blockGasLimit = MAX_GAS_LIMIT_HEX
    }
  }

  if (!selectedToken && !data && !to) {
    paramsForEstimate.to = paramsForEstimate.to || selectedToken.address
  }

  paramsForEstimate.gas = addHexPrefix(
    multiplyCurrencies(blockGasLimit, 0.95, {
      multiplicandBase: 16,
      multiplierBase: 10,
      roundDown: '0',
      toNumericBase: 'hex',
    })
  )

  // run tx
  return new Promise((resolve, reject) => {
    return estimateGasAndCollateralMethod(paramsForEstimate, (err, result) => {
      if (err) {
        const simulationFailed =
          err.message.includes('Internal error') ||
          err.message.includes('Transaction execution error.') ||
          err.message.includes(
            'gas required exceeds allowance or always failing transaction'
          )
        if (simulationFailed) {
          const estimateWithBuffer = addGasBuffer(
            paramsForEstimate.gas,
            blockGasLimit,
            1.5
          )
          return resolve(addHexPrefix(estimateWithBuffer))
        } else {
          return reject(err)
        }
      }
      const {
        gasUsed: estimatedGas,
        storageCollateralized: estimatedStorage,
      } = result

      // only need the storageLimit here
      if (result.gas !== undefined) {
        result.storageLimit = addHexPrefix(estimatedStorage)
        return result
      }
      const estimateWithBuffer = addGasBuffer(
        estimatedGas.toString(16),
        blockGasLimit,
        1.5
      )
      return resolve({
        gas: addHexPrefix(estimateWithBuffer),
        storageLimit: addHexPrefix(estimatedStorage),
      })
    })
  })
}

function addGasBuffer (
  initialGasLimitHex,
  blockGasLimitHex,
  bufferMultiplier = 1.5
) {
  const upperGasLimit = multiplyCurrencies(blockGasLimitHex, 0.9, {
    toNumericBase: 'hex',
    multiplicandBase: 16,
    multiplierBase: 10,
    numberOfDecimals: '0',
  })
  const bufferedGasLimit = multiplyCurrencies(
    initialGasLimitHex,
    bufferMultiplier,
    {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 10,
      numberOfDecimals: '0',
    }
  )

  // if initialGasLimit is above blockGasLimit, dont modify it
  if (
    conversionGreaterThan(
      { value: initialGasLimitHex, fromNumericBase: 'hex' },
      { value: upperGasLimit, fromNumericBase: 'hex' }
    )
  ) {
    return initialGasLimitHex
  }
  // if bufferedGasLimit is below blockGasLimit, use bufferedGasLimit
  if (
    conversionLessThan(
      { value: bufferedGasLimit, fromNumericBase: 'hex' },
      { value: upperGasLimit, fromNumericBase: 'hex' }
    )
  ) {
    return bufferedGasLimit
  }
  // otherwise use blockGasLimit
  return upperGasLimit
}

function generateTokenTransferData ({
  toAddress = '0x0',
  amount = '0x0',
  selectedToken,
}) {
  if (!selectedToken) {
    return
  }
  return (
    TOKEN_TRANSFER_FUNCTION_SIGNATURE +
    Array.prototype.map
      .call(
        abi.rawEncode(
          ['address', 'uint256'],
          [toAddress, addHexPrefix(amount)]
        ),
        (x) => ('00' + x.toString(16)).slice(-2)
      )
      .join('')
  )
}

function getToAddressForGasUpdate (...addresses) {
  return [...addresses, '']
    .find((str) => str !== undefined && str !== null)
    .toLowerCase()
}

function removeLeadingZeroes (str) {
  return str.replace(/^0*(?=\d)/, '')
}

function ellipsify (text, first = 6, last = 4) {
  return `${text.slice(0, first)}...${text.slice(-last)}`
}
