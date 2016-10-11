const scrypt = require('scrypt-async')
const bitcore = require('bitcore-lib')
const configManager = require('./lib/config-manager')

module.exports = class KeyringController {

  constructor (opts) {
    this.configManager = opts.configManager
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

}

function generateSalt (byteCount) {
  return bitcore.crypto.Random.getRandomBuffer(byteCount || 32).toString('base64')
}
