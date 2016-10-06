/* ID Management
 *
 * This module exists to hold the decrypted credentials for the current session.
 * It therefore exposes sign methods, because it is able to perform these
 * with noa dditional authentication, because its very instantiation
 * means the vault is unlocked.
 */

const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const Transaction = require('ethereumjs-tx')

module.exports = IdManagement

function IdManagement (opts) {
  if (!opts) opts = {}

  this.keyStore = opts.keyStore
  this.derivedKey = opts.derivedKey
  this.configManager = opts.configManager
  this.hdPathString = "m/44'/60'/0'/0"

  this.getAddresses = function () {
    return this.keyStore.getAddresses(this.hdPathString).map(function (address) { return '0x' + address })
  }

  this.signTx = function (txParams) {
    //  calculate gas with custom gas multiplier
    var gasMultiplier = txParams.gasMultiplier || 1
    delete txParams.gasMultiplier
    var gasPrice = parseFloat(new BN(ethUtil.stripHexPrefix(txParams.gasPrice), 16).toString()) * gasMultiplier
    txParams.gasPrice = ethUtil.intToHex(parseInt(gasPrice))
    // normalize values

    txParams.to = ethUtil.addHexPrefix(txParams.to)
    txParams.from = ethUtil.addHexPrefix(txParams.from)
    txParams.value = ethUtil.addHexPrefix(txParams.value)
    txParams.data = ethUtil.addHexPrefix(txParams.data)
    txParams.gasLimit = ethUtil.addHexPrefix(txParams.gasLimit || txParams.gas)
    txParams.nonce = ethUtil.addHexPrefix(txParams.nonce)
    var tx = new Transaction(txParams)

    // sign tx
    var privKeyHex = this.exportPrivateKey(txParams.from)
    var privKey = ethUtil.toBuffer(privKeyHex)
    tx.sign(privKey)

    // Add the tx hash to the persisted meta-tx object
    var txHash = ethUtil.bufferToHex(tx.hash())
    var metaTx = this.configManager.getTx(txParams.metamaskId)
    metaTx.hash = txHash
    this.configManager.updateTx(metaTx)

    // return raw serialized tx
    var rawTx = ethUtil.bufferToHex(tx.serialize())
    return rawTx
  }

  this.signMsg = function (address, message) {
    // sign message
    var privKeyHex = this.exportPrivateKey(address)
    var privKey = ethUtil.toBuffer(privKeyHex)
    var msgSig = ethUtil.ecsign(new Buffer(message.replace('0x', ''), 'hex'), privKey)
    var rawMsgSig = ethUtil.bufferToHex(concatSig(msgSig.v, msgSig.r, msgSig.s))
    return rawMsgSig
  }

  this.getSeed = function () {
    return this.keyStore.getSeed(this.derivedKey)
  }

  this.exportPrivateKey = function (address) {
    var privKeyHex = ethUtil.addHexPrefix(this.keyStore.exportPrivateKey(address, this.derivedKey, this.hdPathString))
    return privKeyHex
  }
}

function padWithZeroes (number, length) {
  var myString = '' + number
  while (myString.length < length) {
    myString = '0' + myString
  }
  return myString
}

function concatSig (v, r, s) {
  const rSig = ethUtil.fromSigned(r)
  const sSig = ethUtil.fromSigned(s)
  const vSig = ethUtil.bufferToInt(v)
  const rStr = padWithZeroes(ethUtil.toUnsigned(rSig).toString('hex'), 64)
  const sStr = padWithZeroes(ethUtil.toUnsigned(sSig).toString('hex'), 64)
  const vStr = ethUtil.stripHexPrefix(ethUtil.intToHex(vSig))
  return ethUtil.addHexPrefix(rStr.concat(sStr, vStr)).toString('hex')
}

