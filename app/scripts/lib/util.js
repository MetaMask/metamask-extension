const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN

module.exports = {
  getStack,
  sufficientBalance,
  hexToBn,
  bnToHex,
  BnMultiplyByFraction,
}

function getStack () {
  const stack = new Error('Stack trace generator - not an error').stack
  return stack
}

function sufficientBalance (txParams, hexBalance) {
  const balance = hexToBn(hexBalance)
  const value = hexToBn(txParams.value)
  const gasLimit = hexToBn(txParams.gas)
  const gasPrice = hexToBn(txParams.gasPrice)

  const maxCost = value.add(gasLimit.mul(gasPrice))
  return balance.gte(maxCost)
}

function bnToHex (inputBn) {
  return ethUtil.addHexPrefix(inputBn.toString(16))
}

function hexToBn (inputHex) {
  return new BN(ethUtil.stripHexPrefix(inputHex), 16)
}

function BnMultiplyByFraction (targetBN, numerator, denominator) {
  const numBN = new BN(numerator)
  const denomBN = new BN(denominator)
  return targetBN.mul(numBN).div(denomBN)
}
