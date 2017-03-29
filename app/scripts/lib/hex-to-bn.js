const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN

module.exports = function hexToBn (hex) {
  return new BN(ethUtil.stripHexPrefix(hex), 16)
}

