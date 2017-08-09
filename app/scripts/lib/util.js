const ethUtil = require('ethereumjs-util')
const assert = require('assert')
const BN = require('bn.js')

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
  // validate hexBalance is a hex string
  assert.equal(typeof hexBalance, 'string', 'sufficientBalance - hexBalance is not a hex string')
  assert.equal(hexBalance.slice(0, 2), '0x', 'sufficientBalance - hexBalance is not a hex string')

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
