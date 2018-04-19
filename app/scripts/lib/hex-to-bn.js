const ethUtil = (/** @type {object} */ (require('ethereumjs-util')))
const BN = ethUtil.BN

/**
 * Returns a [BinaryNumber]{@link BN} representation of the given hex value
 * @param {string} hex
 * @return {any}
 */
module.exports = function hexToBn (hex) {
  return new BN(ethUtil.stripHexPrefix(hex), 16)
}

