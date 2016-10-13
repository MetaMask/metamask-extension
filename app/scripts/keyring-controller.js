const scrypt = require('scrypt-async')
const bitcore = require('bitcore-lib')
const configManager = require('./lib/config-manager')
const EventEmitter = require('events').EventEmitter

module.exports = class KeyringController extends EventEmitter {

  constructor (opts) {
    super()
    this.configManager = opts.configManager
    this.ethStore = opts.ethStore
    this.keyChains = []
  }

  getKeyForPassword(password, callback) {
    let salt = this.configManager.getSalt()

    if (!salt) {
      salt = generateSalt(32)
      configManager.setSalt(salt)
    }

    var logN = 14
    var r = 8
    var dkLen = 32
    var interruptStep = 200

    var cb = function(derKey) {
      try {
        var ui8arr = (new Uint8Array(derKey))
        this.pwDerivedKey = ui8arr
        callback(null, ui8arr)
      } catch (err) {
        callback(err)
      }
    }

    scrypt(password, salt, logN, r, dkLen, interruptStep, cb, null)
  }

  getState() {
    return {}
  }

  setStore(ethStore) {
    this.ethStore = ethStore
  }

  createNewVault(password, entropy, cb) {
    cb()
  }

  submitPassword(password, cb) {
    cb()
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
  return bitcore.crypto.Random.getRandomBuffer(byteCount || 32).toString('base64')
}
