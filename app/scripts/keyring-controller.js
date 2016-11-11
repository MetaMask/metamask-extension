const async = require('async')
const EventEmitter = require('events').EventEmitter
const encryptor = require('./lib/encryptor')
const messageManager = require('./lib/message-manager')
const ethUtil = require('ethereumjs-util')
const ethBinToOps = require('eth-bin-to-ops')
const EthQuery = require('eth-query')
const BN = ethUtil.BN
const Transaction = require('ethereumjs-tx')
const createId = require('web3-provider-engine/util/random-id')
const autoFaucet = require('./lib/auto-faucet')
const bip39 = require('bip39')

// TEMPORARY UNTIL FULL DEPRECATION:
const IdStoreMigrator = require('./lib/idStore-migrator')

// Keyrings:
const SimpleKeyring = require('./keyrings/simple')
const HdKeyring = require('./keyrings/hd')
const keyringTypes = [
  SimpleKeyring,
  HdKeyring,
]

module.exports = class KeyringController extends EventEmitter {

  constructor (opts) {
    super()
    this.web3 = opts.web3
    this.configManager = opts.configManager
    this.ethStore = opts.ethStore
    this.encryptor = encryptor
    this.keyringTypes = keyringTypes

    this.keyrings = []
    this.identities = {} // Essentially a name hash

    this._unconfTxCbs = {}
    this._unconfMsgCbs = {}

    this.getNetwork = opts.getNetwork

    // TEMPORARY UNTIL FULL DEPRECATION:
    this.idStoreMigrator = new IdStoreMigrator({
      configManager: this.configManager,
    })
  }

  getState () {
    const configManager = this.configManager
    const address = configManager.getSelectedAccount()
    const wallet = configManager.getWallet() // old style vault
    const vault = configManager.getVault() // new style vault

    return {
      seedWords: this.configManager.getSeedWords(),
      isInitialized: (!!wallet || !!vault),
      isUnlocked: !!this.key,
      isConfirmed: true, // AUDIT this.configManager.getConfirmed(),
      unconfTxs: this.configManager.unconfirmedTxs(),
      transactions: this.configManager.getTxList(),
      unconfMsgs: messageManager.unconfirmedMsgs(),
      messages: messageManager.getMsgList(),
      selectedAddress: address,
      selectedAccount: address,
      shapeShiftTxList: this.configManager.getShapeShiftTxList(),
      currentFiat: this.configManager.getCurrentFiat(),
      conversionRate: this.configManager.getConversionRate(),
      conversionDate: this.configManager.getConversionDate(),
      keyringTypes: this.keyringTypes.map((krt) => krt.type()),
      identities: this.identities,
    }
  }

  setStore (ethStore) {
    this.ethStore = ethStore
  }

  createNewVaultAndKeychain (password, entropy, cb) {
    this.createNewVault(password, entropy, (err) => {
      if (err) return cb(err)
      this.createFirstKeyTree(password, cb)
    })
  }

  createNewVaultAndRestore (password, seed, cb) {
    if (typeof password !== 'string') {
      return cb('Password must be text.')
    }

    if (!bip39.validateMnemonic(seed)) {
      return cb('Seed phrase is invalid.')
    }

    this.clearKeyrings()

    this.createNewVault(password, '', (err) => {
      if (err) return cb(err)
      this.addNewKeyring('HD Key Tree', {
        mnemonic: seed,
        n: 1,
      }, (err) => {
        if (err) return cb(err)
        const firstKeyring = this.keyrings[0]
        const accounts = firstKeyring.getAccounts()
        const firstAccount = accounts[0]
        const hexAccount = normalize(firstAccount)
        this.configManager.setSelectedAccount(hexAccount)
        this.setupAccounts(accounts)

        this.emit('update')
        cb(null, this.getState())
      })
    })
  }

  migrateAndGetKey (password) {
    let key
    const shouldMigrate = !!this.configManager.getWallet() && !this.configManager.getVault()

    return this.loadKey(password)
    .then((derivedKey) => {
      key = derivedKey
      this.key = key
      return this.idStoreMigrator.oldSeedForPassword(password)
    })
    .then((serialized) => {
      if (serialized && shouldMigrate) {
        const keyring = this.restoreKeyring(serialized)
        this.keyrings.push(keyring)
        this.configManager.setSelectedAccount(keyring.getAccounts()[0])
      }
      return key
    })
  }

  createNewVault (password, entropy, cb) {
    const configManager = this.configManager
    const salt = this.encryptor.generateSalt()
    configManager.setSalt(salt)

    return this.migrateAndGetKey(password)
    .then(() => {
      return this.persistAllKeyrings()
    })
    .then(() => {
      cb(null)
    })
    .catch((err) => {
      cb(err)
    })
  }

  createFirstKeyTree (password, cb) {
    this.clearKeyrings()
    this.addNewKeyring('HD Key Tree', {n: 1}, (err) => {
      const firstKeyring = this.keyrings[0]
      const accounts = firstKeyring.getAccounts()
      const firstAccount = accounts[0]
      const hexAccount = normalize(firstAccount)
      const seedWords = firstKeyring.serialize().mnemonic
      this.configManager.setSelectedAccount(firstAccount)
      this.configManager.setSeedWords(seedWords)
      autoFaucet(hexAccount)
      this.setupAccounts(accounts)
      this.persistAllKeyrings()
      .then(() => {
        cb(err, this.getState())
      })
      .catch((reason) => {
        cb(reason)
      })
    })
  }

  placeSeedWords (cb) {
    const firstKeyring = this.keyrings[0]
    const seedWords = firstKeyring.serialize().mnemonic
    this.configManager.setSeedWords(seedWords)
  }

  submitPassword (password, cb) {
    this.migrateAndGetKey(password)
    .then((key) => {
      return this.unlockKeyrings(key)
    })
    .then((keyrings) => {
      this.keyrings = keyrings
      this.setupAccounts()
      this.emit('update')
      cb(null, this.getState())
    })
    .catch((err) => {
      console.error(err)
      cb(err)
    })
  }

  loadKey (password) {
    const salt = this.configManager.getSalt() || this.encryptor.generateSalt()
    return this.encryptor.keyFromPassword(password + salt)
    .then((key) => {
      this.key = key
      this.configManager.setSalt(salt)
      return key
    })
  }

  addNewKeyring (type, opts, cb) {
    const Keyring = this.getKeyringClassForType(type)
    const keyring = new Keyring(opts)
    const accounts = keyring.getAccounts()

    this.keyrings.push(keyring)
    this.setupAccounts(accounts)
    this.persistAllKeyrings()
    .then(() => {
      cb(null, this.getState())
    })
    .catch((reason) => {
      cb(reason)
    })
  }

  addNewAccount (keyRingNum = 0, cb) {
    const ring = this.keyrings[keyRingNum]
    const accounts = ring.addAccounts(1)
    this.setupAccounts(accounts)
    this.persistAllKeyrings()
    .then(() => {
      cb(null, this.getState())
    })
    .catch((reason) => {
      cb(reason)
    })
  }

  setupAccounts (accounts) {
    var arr = accounts || this.getAccounts()
    arr.forEach((account) => {
      this.loadBalanceAndNickname(account)
    })
  }

  // Takes an account address and an iterator representing
  // the current number of named accounts.
  loadBalanceAndNickname (account) {
    const address = normalize(account)
    this.ethStore.addAccount(address)
    this.createNickname(address)
  }

  createNickname (address) {
    const hexAddress = normalize(address)
    var i = Object.keys(this.identities).length
    const oldNickname = this.configManager.nicknameForWallet(address)
    const name = oldNickname || `Account ${++i}`
    this.identities[hexAddress] = {
      address: hexAddress,
      name,
    }
    return this.saveAccountLabel(hexAddress, name)
  }

  saveAccountLabel (account, label, cb) {
    const address = normalize(account)
    const configManager = this.configManager
    configManager.setNicknameForWallet(address, label)
    this.identities[address].name = label
    if (cb) {
      cb(null, label)
    } else {
      return label
    }
  }

  persistAllKeyrings () {
    const serialized = this.keyrings.map((k) => {
      return {
        type: k.type,
        data: k.serialize(),
      }
    })

    return this.encryptor.encryptWithKey(this.key, serialized)
    .then((encryptedString) => {
      this.configManager.setVault(encryptedString)
      return true
    })
  }

  unlockKeyrings (key) {
    const encryptedVault = this.configManager.getVault()
    return this.encryptor.decryptWithKey(key, encryptedVault)
    .then((vault) => {
      vault.forEach(this.restoreKeyring.bind(this))
      return this.keyrings
    })
  }

  restoreKeyring (serialized) {
    const { type, data } = serialized
    const Keyring = this.getKeyringClassForType(type)
    const keyring = new Keyring()
    keyring.deserialize(data)

    const accounts = keyring.getAccounts()
    this.setupAccounts(accounts)

    this.keyrings.push(keyring)
    return keyring
  }

  getKeyringClassForType (type) {
    const Keyring = this.keyringTypes.reduce((res, kr) => {
      if (kr.type() === type) {
        return kr
      } else {
        return res
      }
    })
    return Keyring
  }

  getAccounts () {
    const keyrings = this.keyrings || []
    return keyrings.map(kr => kr.getAccounts())
    .reduce((res, arr) => {
      return res.concat(arr)
    }, [])
  }

  setSelectedAddress (address, cb) {
    var addr = normalize(address)
    this.configManager.setSelectedAccount(addr)
    cb(null, addr)
  }

  addUnconfirmedTransaction (txParams, onTxDoneCb, cb) {
    var self = this
    const configManager = this.configManager

    // create txData obj with parameters and meta data
    var time = (new Date()).getTime()
    var txId = createId()
    txParams.metamaskId = txId
    txParams.metamaskNetworkId = this.getNetwork()
    var txData = {
      id: txId,
      txParams: txParams,
      time: time,
      status: 'unconfirmed',
      gasMultiplier: configManager.getGasMultiplier() || 1,
      metamaskNetworkId: this.getNetwork(),
    }


    // keep the onTxDoneCb around for after approval/denial (requires user interaction)
    // This onTxDoneCb fires completion to the Dapp's write operation.
    this._unconfTxCbs[txId] = onTxDoneCb

    var provider = this.ethStore._query.currentProvider
    var query = new EthQuery(provider)

    // calculate metadata for tx
    async.parallel([
      analyzeForDelegateCall,
      estimateGas,
    ], didComplete)

    // perform static analyis on the target contract code
    function analyzeForDelegateCall (cb) {
      if (txParams.to) {
        query.getCode(txParams.to, function (err, result) {
          if (err) return cb(err)
          var code = ethUtil.toBuffer(result)
          if (code !== '0x') {
            var ops = ethBinToOps(code)
            var containsDelegateCall = ops.some((op) => op.name === 'DELEGATECALL')
            txData.containsDelegateCall = containsDelegateCall
            cb()
          } else {
            cb()
          }
        })
      } else {
        cb()
      }
    }

    function estimateGas (cb) {
      query.estimateGas(txParams, function (err, result) {
        if (err) return cb(err)
        txData.estimatedGas = self.addGasBuffer(result)
        cb()
      })
    }

    function didComplete (err) {
      if (err) return cb(err)
      configManager.addTx(txData)
      // signal update
      self.emit('update')
      // signal completion of add tx
      cb(null, txData)
    }
  }

  addUnconfirmedMessage (msgParams, cb) {
    // create txData obj with parameters and meta data
    var time = (new Date()).getTime()
    var msgId = createId()
    var msgData = {
      id: msgId,
      msgParams: msgParams,
      time: time,
      status: 'unconfirmed',
    }
    messageManager.addMsg(msgData)
    console.log('addUnconfirmedMessage:', msgData)

    // keep the cb around for after approval (requires user interaction)
    // This cb fires completion to the Dapp's write operation.
    this._unconfMsgCbs[msgId] = cb

    // signal update
    this.emit('update')
    return msgId
  }

  approveTransaction (txId, cb) {
    const configManager = this.configManager
    var approvalCb = this._unconfTxCbs[txId] || noop

    // accept tx
    cb()
    approvalCb(null, true)
    // clean up
    configManager.confirmTx(txId)
    delete this._unconfTxCbs[txId]
    this.emit('update')
  }

  cancelTransaction (txId, cb) {
    const configManager = this.configManager
    var approvalCb = this._unconfTxCbs[txId] || noop

    // reject tx
    approvalCb(null, false)
    // clean up
    configManager.rejectTx(txId)
    delete this._unconfTxCbs[txId]

    if (cb && typeof cb === 'function') {
      cb()
    }
  }

  signTransaction (txParams, cb) {
    try {
      const address = normalize(txParams.from)
      const keyring = this.getKeyringForAccount(address)

      // Handle gas pricing
      var gasMultiplier = this.configManager.getGasMultiplier() || 1
      var gasPrice = new BN(ethUtil.stripHexPrefix(txParams.gasPrice), 16)
      gasPrice = gasPrice.mul(new BN(gasMultiplier * 100, 10)).div(new BN(100, 10))
      txParams.gasPrice = ethUtil.intToHex(gasPrice.toNumber())

      // normalize values
      txParams.to = normalize(txParams.to)
      txParams.from = normalize(txParams.from)
      txParams.value = normalize(txParams.value)
      txParams.data = normalize(txParams.data)
      txParams.gasLimit = normalize(txParams.gasLimit || txParams.gas)
      txParams.nonce = normalize(txParams.nonce)

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

  signMessage (msgParams, cb) {
    try {
      const keyring = this.getKeyringForAccount(msgParams.from)
      const address = normalize(msgParams.from)
      const rawSig = keyring.signMessage(address, msgParams.data)
      cb(null, rawSig)
    } catch (e) {
      cb(e)
    }
  }

  getKeyringForAccount (address) {
    const hexed = normalize(address)
    return this.keyrings.find((ring) => {
      return ring.getAccounts()
      .map(normalize)
      .includes(hexed)
    })
  }

  cancelMessage (msgId, cb) {
    if (cb && typeof cb === 'function') {
      cb()
    }
  }

  setLocked (cb) {
    this.key = null
    this.keyrings = []
    cb()
  }

  exportAccount (address, cb) {
    try {
      const keyring = this.getKeyringForAccount(address)
      const privateKey = keyring.exportAccount(normalize(address))
      cb(null, privateKey)
    } catch (e) {
      cb(e)
    }
  }

  addGasBuffer (gas) {
    const gasBuffer = new BN('100000', 10)
    const bnGas = new BN(ethUtil.stripHexPrefix(gas), 16)
    const correct = bnGas.add(gasBuffer)
    return ethUtil.addHexPrefix(correct.toString(16))
  }

  clearSeedWordCache (cb) {
    this.configManager.setSeedWords(null)
    cb(null, this.configManager.getSelectedAccount())
  }

  clearKeyrings () {
    let accounts
    try {
      accounts = Object.keys(this.ethStore._currentState.accounts)
    } catch (e) {
      accounts = []
    }
    accounts.forEach((address) => {
      this.ethStore.removeAccount(address)
    })

    this.keyrings = []
    this.identities = {}
    this.configManager.setSelectedAccount()
  }

}

function normalize (address) {
  if (!address) return
  return ethUtil.addHexPrefix(address.toLowerCase())
}

function noop () {}
