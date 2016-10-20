const EventEmitter = require('events').EventEmitter
const encryptor = require('./lib/encryptor')
const messageManager = require('./lib/message-manager')


module.exports = class KeyringController extends EventEmitter {

  constructor (opts) {
    super()
    this.configManager = opts.configManager
    this.ethStore = opts.ethStore
    this.keyChains = []
  }

  getState() {
    return {
      isInitialized: !!this.configManager.getVault(),
      isUnlocked: !!this.key,
      isConfirmed: true, // this.configManager.getConfirmed(),
      isEthConfirmed: this.configManager.getShouldntShowWarning(),
      unconfTxs: this.configManager.unconfirmedTxs(),
      transactions: this.configManager.getTxList(),
      unconfMsgs: messageManager.unconfirmedMsgs(),
      messages: messageManager.getMsgList(),
      selectedAddress: this.configManager.getSelectedAccount(),
      shapeShiftTxList: this.configManager.getShapeShiftTxList(),
      currentFiat: this.configManager.getCurrentFiat(),
      conversionRate: this.configManager.getConversionRate(),
      conversionDate: this.configManager.getConversionDate(),
    }
  }

  setStore(ethStore) {
    this.ethStore = ethStore
  }

  createNewVault(password, entropy, cb) {
    const salt = generateSalt()
    this.configManager.setSalt(salt)
    this.loadKey(password)
    .then((key) => {
      return encryptor.encryptWithKey(key, {})
    })
    .then((encryptedString) => {
      this.configManager.setVault(encryptedString)
      cb(null, this.getState())
    })
    .catch((err) => {
      cb(err)
    })
  }

  submitPassword(password, cb) {
    this.loadKey(password)
    .then((key) => {
      cb(null, this.getState())
    })
    .catch((err) => {
      cb(err)
    })
  }

  loadKey(password) {
    const salt = this.configManager.getSalt()
    return encryptor.keyFromPassword(password + salt)
    .then((key) => {
      this.key = key
      return key
    })
  }

  setSelectedAddress(address, cb) {
    this.selectedAddress = address
    cb(null, address)
  }

  approveTransaction(txId, cb) {
    cb()
  }

  cancelTransaction(txId, cb) {
    if (cb && typeof cb === 'function') {
      cb()
    }
  }

  signMessage(msgParams, cb) {
    cb()
  }

  cancelMessage(msgId, cb) {
    if (cb && typeof cb === 'function') {
      cb()
    }
  }

  setLocked(cb) {
    cb()
  }

  exportAccount(address, cb) {
    cb(null, '0xPrivateKey')
  }

  saveAccountLabel(account, label, cb) {
    cb(/* null, label */)
  }

  tryPassword(password, cb) {
    cb()
  }

}

function generateSalt (byteCount) {
  var view = new Uint8Array(32)
  global.crypto.getRandomValues(view)
  var b64encoded = btoa(String.fromCharCode.apply(null, view))
  return b64encoded
}
