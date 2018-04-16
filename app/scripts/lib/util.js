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

/**
 * Generates an example stack trace
 *
 * @returns {string} A stack trace
 *
 */
function getStack () {
  const stack = new Error('Stack trace generator - not an error').stack
  return stack
}

/**
 * Checks whether a given balance of ETH, represented as a hex string, is sufficient to pay a value plus a gas fee
 *
 * @param {object} txParams Contains data about a transaction
 * @param {string} txParams.gas The gas for a transaction
 * @param {string} txParams.gasPrice The price per gas for the transaction
 * @param {string} txParams.value The value of ETH to send
 * @param {string} hexBalance A balance of ETH represented as a hex string
 * @returns {boolean} Whether the balance is greater than or equal to the value plus the value of gas times gasPrice
 *
 */
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

/**
 * Converts a BN object to a hex string with a '0x' prefix
 *
 * @param {BN} inputBn Description
 * @returns {string} A hex string
 *
 */
function bnToHex (inputBn) {
  return ethUtil.addHexPrefix(inputBn.toString(16))
}

/**
 * Converts a hex string to a BN object
 *
 * @param {string} inputHex A number represented as a hex string
 * @returns {Object} A BN object
 *
 */
function hexToBn (inputHex) {
  return new BN(ethUtil.stripHexPrefix(inputHex), 16)
}

/**
 * Used to multiply a BN by a fraction
 *
 * @param {BN} targetBN The number to multiply by a fraction
 * @param {number|string} numerator
 * @param {number|string} denominator
 * @returns {BN} The product of the multiplication
 *
 */
function BnMultiplyByFraction (targetBN, numerator, denominator) {
  const numBN = new BN(numerator)
  const denomBN = new BN(denominator)
  return targetBN.mul(numBN).div(denomBN)
}
