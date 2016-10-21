const EventEmitter = require('events').EventEmitter
const encryptor = require('./lib/encryptor')
const messageManager = require('./lib/message-manager')
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const Transaction = require('ethereumjs-tx')

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
    this.identities = {} // Essentially a name hash
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
    .then(() => {
      cb(null, this.getState())
    })
    .catch((err) => {
      cb(err)
    })
  }

  loadKey(password) {
    const salt = this.configManager.getSalt() || generateSalt()
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
      this.loadBalanceAndNickname(account, i)
    })

    this.keyrings.push(keyring)
    this.persistAllKeyrings()
    .then(() => {
      cb(this.getState())
    })
    .catch((reason) => {
      cb(reason)
    })
  }

  // Takes an account address and an iterator representing
  // the current number of named accounts.
  loadBalanceAndNickname(account, i) {
    const address = ethUtil.addHexPrefix(account)
    this.ethStore.addAccount(address)
    const oldNickname = this.configManager.nicknameForWallet(address)
    const name = oldNickname || `Account ${++i}`
    this.identities[address] = {
      address,
      name,
    }
    this.saveAccountLabel(address, name)
  }

  saveAccountLabel (account, label, cb) {
    const address = ethUtil.addHexPrefix(account)
    const configManager = this.configManager
    configManager.setNicknameForWallet(address, label)
    if (cb) {
      cb(null, label)
    }
  }

  persistAllKeyrings() {
    const serialized = this.keyrings.map((k) => {
      return {
        type: k.type,
        // keyring.serialize() must return a JSON-encodable object.
        data: k.serialize(),
      }
    })
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
      this.keyrings = vault.map(this.restoreKeyring.bind(this, 0))
      return this.keyrings
    })
  }

  restoreKeyring(serialized, i) {
    const { type, data } = serialized
    const Keyring = this.getKeyringClassForType(type)
    const keyring = new Keyring()
    keyring.deserialize(data)

    keyring.getAccounts().forEach((account) => {
      this.loadBalanceAndNickname(account, i)
    })

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
    const keyrings = this.keyrings || []
    return keyrings.map(kr => kr.getAccounts())
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

  signTransaction(txParams, cb) {
    try {
      const address = ethUtil.addHexPrefix(txParams.from.toLowercase())
      const keyring = this.getKeyringForAccount(address)

      // Handle gas pricing
      var gasMultiplier = this.configManager.getGasMultiplier() || 1
      var gasPrice = new BN(ethUtil.stripHexPrefix(txParams.gasPrice), 16)
      gasPrice = gasPrice.mul(new BN(gasMultiplier * 100, 10)).div(new BN(100, 10))
      txParams.gasPrice = ethUtil.intToHex(gasPrice.toNumber())

      // normalize values
      txParams.to = ethUtil.addHexPrefix(txParams.to.toLowerCase())
      txParams.from = ethUtil.addHexPrefix(txParams.from.toLowerCase())
      txParams.value = ethUtil.addHexPrefix(txParams.value)
      txParams.data = ethUtil.addHexPrefix(txParams.data)
      txParams.gasLimit = ethUtil.addHexPrefix(txParams.gasLimit || txParams.gas)
      txParams.nonce = ethUtil.addHexPrefix(txParams.nonce)

      let tx = new Transaction(txParams)
      tx = keyring.signTransaction(address, tx)

      // Add the tx hash to the persisted meta-tx object
      var txHash = ethUtil.bufferToHex(tx.hash())
      var metaTx = this.configManager.getTx(txParams.metamaskId)
      metaTx.hash = txHash
      this.configManager.updateTx(metaTx)

      // return raw serialized tx
      var rawTx = ethUtil.bufferToHex(tx.serialize())
      cb(null, rawTx)
    } catch (e) {
      cb(e)
    }
  }

  signMessage(msgParams, cb) {
    try {
      const keyring = this.getKeyringForAccount(msgParams.from)
      const address = ethUtil.addHexPrefix(msgParams.from.toLowercase())
      const rawSig = keyring.signMessage(address, msgParams.data)
      cb(null, rawSig)
    } catch (e) {
      cb(e)
    }
  }

  getKeyringForAccount(address) {
    const hexed = ethUtil.addHexPrefix(address.toLowerCase())
    return this.keyrings.find((ring) => {
      return ring.getAccounts()
      .map(acct => ethUtil.addHexPrefix(acct.toLowerCase()))
      .includes(hexed)
    })
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

function generateSalt (byteCount = 32) {
  var view = new Uint8Array(byteCount)
  global.crypto.getRandomValues(view)
  var b64encoded = btoa(String.fromCharCode.apply(null, view))
  return b64encoded
}
