import {
  addCurrencies,
  conversionUtil,
  conversionGTE,
  multiplyCurrencies,
  conversionGreaterThan,
  conversionLessThan,
} from '../../helpers/utils/conversion-util'
import BigNumber from 'bignumber.js'

import { calcTokenAmount } from '../../helpers/utils/token-util'

import {
  INVALID_HEX_ERROR,
  BASE_TOKEN_GAS_COST,
  GAS_PRICE_TOO_LOW,
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
  NEGATIVE_ETH_ERROR,
  SIMPLE_GAS_COST,
  SIMPLE_STORAGE_COST,
  TOKEN_TRANSFER_FUNCTION_SIGNATURE,
} from './send.constants'

import { storageToDrip as calcStorageTotal } from '../../helpers/utils/storage-util'

import abi from '@cfxjs/abi'

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
  getHexDataErrorObject,
  getAmountErrorObject,
  getGasFeeErrorObject,
  getGasPriceErrorObject,
  getToAddressForGasUpdate,
  isBalanceSufficient,
  isTokenBalanceSufficient,
  removeLeadingZeroes,
  ellipsify,
}

function calcGasTotal(gasLimit = '0', gasPrice = '0') {
  return multiplyCurrencies(gasLimit, gasPrice, {
    toNumericBase: 'hex',
    multiplicandBase: 16,
    multiplierBase: 16,
  })
}

function calcGasAndCollateralTotal(
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

function isBalanceSufficient({
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

function isTokenBalanceSufficient({ amount = '0x0', tokenBalance, decimals }) {
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

function getHexDataErrorObject(hexData) {
  if (
    hexData &&
    hexData.length &&
    (hexData.length % 2 !== 0 ||
      (!/^0x[a-fA-F0-9]+$/.test(hexData) && !/^[a-fA-F0-9]+$/.test(hexData)))
  ) {
    return { hexData: INVALID_HEX_ERROR }
  }

  return { hexData: null }
}

function getAmountErrorObject({
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

function getGasPriceErrorObject({ gasPrice }) {
  let gasPriceTooLow = null
  let gasPriceBigNumber
  try {
    gasPriceBigNumber = new BigNumber(gasPrice || '0', 16)
  } catch (err) {
    gasPriceBigNumber = new BigNumber(0)
  }

  gasPriceTooLow = gasPriceBigNumber.lessThan(1) ? GAS_PRICE_TOO_LOW : null

  return { gasPriceTooLow }
}

function getGasFeeErrorObject({
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

function calcTokenBalance({ selectedToken, usersToken }) {
  const { decimals } = selectedToken || {}
  return calcTokenAmount(usersToken.balance.toString(), decimals).toString(16)
}

function doesAmountErrorRequireUpdate({
  gasPrice,
  prevGasPrice,
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
  const gasPriceChanged = gasPrice !== prevGasPrice
  const balanceHasChanged = balance !== prevBalance
  const gasTotalHasChange = gasTotal !== prevGasTotal
  const storageTotalHasChange = storageTotal !== prevStorageTotal
  const tokenBalanceHasChanged =
    selectedToken && tokenBalance !== prevTokenBalance
  const sponsorshipInfoIsLoadingChanged =
    sponsorshipInfoIsLoading !== prevSponsorshipInfoIsLoading
  const amountErrorRequiresUpdate =
    gasPriceChanged ||
    balanceHasChanged ||
    gasTotalHasChange ||
    tokenBalanceHasChanged ||
    storageTotalHasChange ||
    sponsorshipInfoIsLoadingChanged

  return amountErrorRequiresUpdate
}

async function checkSponsorshipInfo({
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

  return new Promise(resolve => {
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

async function estimateGasAndCollateral({
  selectedAddress,
  selectedToken,
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
  }

  if (!selectedToken && !data && !to) {
    paramsForEstimate.to = paramsForEstimate.to || selectedToken.address
  }

  // run tx
  return new Promise((resolve, reject) => {
    return estimateGasAndCollateralMethod(paramsForEstimate, (err, result) => {
      if (err) {
        return reject(err)
      }
      const {
        gasUsed: estimatedGas,
        storageCollateralized: estimatedStorage,
      } = result

      return resolve({
        gas: addHexPrefix(
          multiplyCurrencies(addHexPrefix(estimatedGas), 1.3, {
            toNumericBase: 'hex',
            multiplicandBase: 16,
            multiplierBase: 10,
            numberOfDecimals: '0',
          })
        ),
        storageLimit: addHexPrefix(estimatedStorage),
      })
    })
  })
}

function addGasBuffer(
  initialGasLimitHex,
  blockGasLimitHex,
  bufferMultiplier = 1.3
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

function generateTokenTransferData({
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
        x => ('00' + x.toString(16)).slice(-2)
      )
      .join('')
  )
}

function getToAddressForGasUpdate(...addresses) {
  return [...addresses, '']
    .find(str => str !== undefined && str !== null)
    .toLowerCase()
}

function removeLeadingZeroes(str) {
  return str.replace(/^0*(?=\d)/, '')
}

function ellipsify(text, first = 6, last = 4) {
  return `${text.slice(0, first)}...${text.slice(-last)}`
}
