const EventEmitter = require('events').EventEmitter
const encryptor = require('./lib/encryptor')
const messageManager = require('./lib/message-manager')
const ethUtil = require('ethereumjs-util')

// Keyrings:
const SimpleKeyring = require('./keyrings/simple')
const keyringTypes = [
  SimpleKeyring,
]

module.exports = class KeyringController extends EventEmitter {

  constructor (opts) {
    super()
    this.configManager = opts.configManager
    this.ethStore = opts.ethStore
    this.keyrings = []
    this.identities = {} // Essentially a nickname hash
  }

  getState() {
    return {
      isInitialized: !!this.configManager.getVault(),
      isUnlocked: !!this.key,
      isConfirmed: true, // AUDIT this.configManager.getConfirmed(),
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
      keyringTypes: keyringTypes.map((krt) => krt.type()),
      identities: this.identities,
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
      return encryptor.encryptWithKey(key, [])
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
      return this.unlockKeyrings(key)
    })
    .then((keyrings) => {
      this.keyrings = keyrings
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

  addNewKeyring(type, opts, cb) {
    const i = this.getAccounts().length
    const Keyring = this.getKeyringClassForType(type)
    const keyring = new Keyring(opts)
    const accounts = keyring.addAccounts(1)

    accounts.forEach((account) => {
      this.createBalanceAndNickname(account, i)
    })

    this.persistAllKeyrings()
    .then(() => {
      cb(this.getState())
    })
    .catch((reason) => {
      cb(reason)
    })
  }

  // Takes an account address and an iterator representing
  // the current number of nicknamed accounts.
  createBalanceAndNickname(account, i) {
    this.ethStore.addAccount(ethUtil.addHexPrefix(account))
    const oldNickname = this.configManager.nicknameForWallet(account)
    const nickname = oldNickname || `Account ${++i}`
    this.identities[account] = {
      address: account,
      nickname,
    }
    this.saveAccountLabel(account, nickname)
  }

  saveAccountLabel (account, label, cb) {
    const configManager = this.configManager
    configManager.setNicknameForWallet(account, label)
    if (cb) {
      cb(null, label)
    }
  }

  persistAllKeyrings() {
    const serialized = this.keyrings.map(k => k.serialize())
    return encryptor.encryptWithKey(this.key, serialized)
    .then((encryptedString) => {
      this.configManager.setVault(encryptedString)
      return true
    })
    .catch((reason) => {
      console.error('Failed to persist keyrings.', reason)
    })
  }

  unlockKeyrings(key) {
    const encryptedVault = this.configManager.getVault()
    return encryptor.decryptWithKey(key, encryptedVault)
    .then((vault) => {
      this.keyrings = vault.map(this.restoreKeyring)
      return this.keyrings
    })
  }

  restoreKeyring(serialized) {
    const { type } = serialized
    const Keyring = this.getKeyringClassForType(type)
    const keyring = new Keyring(serialized)
    return keyring
  }

  getKeyringClassForType(type) {
    const Keyring = keyringTypes.reduce((res, kr) => {
      if (kr.type() === type) {
        return kr
      } else {
        return res
      }
    })
    return Keyring
  }

  getAccounts() {
    return this.keyrings.map(kr => kr.getAccounts())
    .reduce((res, arr) => {
      return res.concat(arr)
    }, [])
  }

  setSelectedAddress(address, cb) {
    this.configManager.setSelectedAccount(address)
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
