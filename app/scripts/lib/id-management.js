const ethUtil = require('ethereumjs-util')
const Transaction = require('ethereumjs-tx')
const configManager = require('./config-manager-singleton')

module.exports = IdManagement

function IdManagement (opts) {
  if (!opts) opts = {}

  this.keyStore = opts.keyStore
  this.derivedKey = opts.derivedKey
  this.hdPathString = "m/44'/60'/0'/0"

  this.getAddresses = function () {
    return this.keyStore.getAddresses(this.hdPathString).map(function (address) { return '0x' + address })
  }

  this.signTx = function (txParams) {
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
    var metaTx = configManager.getTx(txParams.metamaskId)
    metaTx.hash = txHash
    configManager.updateTx(metaTx)

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
  r = padWithZeroes(ethUtil.fromSigned(r), 64)
  s = padWithZeroes(ethUtil.fromSigned(s), 64)
  r = ethUtil.stripHexPrefix(r.toString('hex'))
  s = ethUtil.stripHexPrefix(s.toString('hex'))
  v = ethUtil.stripHexPrefix(ethUtil.intToHex(v))
  return ethUtil.addHexPrefix(r.concat(s, v))
}
