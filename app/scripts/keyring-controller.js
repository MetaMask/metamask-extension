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

    this.network = null

    // TEMPORARY UNTIL FULL DEPRECATION:
    this.idStoreMigrator = new IdStoreMigrator({
      configManager: this.configManager,
    })
  }

  getState() {
    return {
      seedWords: this.configManager.getSeedWords(),
      isInitialized: !!this.configManager.getVault(),
      isUnlocked: !!this.key,
      isConfirmed: true, // AUDIT this.configManager.getConfirmed(),
      unconfTxs: this.configManager.unconfirmedTxs(),
      transactions: this.configManager.getTxList(),
      unconfMsgs: messageManager.unconfirmedMsgs(),
      messages: messageManager.getMsgList(),
      selectedAddress: this.configManager.getSelectedAccount(),
      shapeShiftTxList: this.configManager.getShapeShiftTxList(),
      currentFiat: this.configManager.getCurrentFiat(),
      conversionRate: this.configManager.getConversionRate(),
      conversionDate: this.configManager.getConversionDate(),
      keyringTypes: this.keyringTypes.map((krt) => krt.type()),
      identities: this.identities,
      network: this.network,
    }
  }

  setStore(ethStore) {
    this.ethStore = ethStore
  }

  createNewVault(password, entropy, cb) {
    const salt = this.encryptor.generateSalt()
    this.configManager.setSalt(salt)

    let serialized

    this.idStoreMigrator.oldSeedForPassword(password)
    .then((oldSerialized) => {
      if (oldSerialized) {
        serialized = oldSerialized
      }
      return this.loadKey(password)
    })
    .then((key) => {
      const first = serialized ? [serialized] : []
      return this.encryptor.encryptWithKey(key, first)
    })
    .then((encryptedString) => {
      this.configManager.setVault(encryptedString)

      if (!serialized) {
        this.addNewKeyring('HD Key Tree', null, (err, newState) => {
          const firstKeyring = this.keyrings[0]
          const firstAccount = firstKeyring.getAccounts()[0]
          const hexAccount = ethUtil.addHexPrefix(firstAccount)
          const seedWords = firstKeyring.serialize().mnemonic
          this.configManager.setSelectedAccount(hexAccount)
          this.configManager.setSeedWords(seedWords)
          autoFaucet(hexAccount)
          cb(err, newState)
        })
      } else {
        return this.submitPassword(password, cb)
      }

      // NORMAL BEHAVIOR:
      // return cb(null, this.getState())
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
    const salt = this.configManager.getSalt() || this.encryptor.generateSalt()
    return this.encryptor.keyFromPassword(password + salt)
    .then((key) => {
      this.key = key
      this.configManager.setSalt(salt)
      return key
    })
  }

  addNewKeyring(type, opts, cb) {
    const Keyring = this.getKeyringClassForType(type)
    const keyring = new Keyring(opts)
    const accounts = keyring.addAccounts(1)

    this.setupAccounts(accounts)
    this.keyrings.push(keyring)
    this.persistAllKeyrings()
    .then(() => {
      cb(null, this.getState())
    })
    .catch((reason) => {
      cb(reason)
    })
  }

  addNewAccount(keyRingNum = 0, cb) {
    const ring = this.keyrings[keyRingNum]
    const accounts = ring.addAccounts(1)
    this.setupAccounts(accounts)
    cb(null, this.getState())
  }

  setupAccounts(accounts) {
    const i = this.getAccounts().length
    accounts.forEach((account) => {
      this.loadBalanceAndNickname(account, i)
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
    return this.encryptor.encryptWithKey(this.key, serialized)
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
    return this.encryptor.decryptWithKey(key, encryptedVault)
    .then((vault) => {
      this.keyrings = vault.map(this.restoreKeyring.bind(this, 0))
      return this.keyrings
    })
  }

  restoreKeyring(i, serialized) {
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
    const Keyring = this.keyringTypes.reduce((res, kr) => {
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

  addUnconfirmedTransaction(txParams, onTxDoneCb, cb) {
    var self = this
    const configManager = this.configManager

    // create txData obj with parameters and meta data
    var time = (new Date()).getTime()
    var txId = createId()
    txParams.metamaskId = txId
    txParams.metamaskNetworkId = this.network
    var txData = {
      id: txId,
      txParams: txParams,
      time: time,
      status: 'unconfirmed',
      gasMultiplier: configManager.getGasMultiplier() || 1,
    }

    console.log('addUnconfirmedTransaction:', txData)

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
    function analyzeForDelegateCall(cb){
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

    function estimateGas(cb){
      query.estimateGas(txParams, function(err, result){
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

  addUnconfirmedMessage(msgParams, cb) {
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

  approveTransaction(txId, cb) {
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

  cancelTransaction(txId, cb) {
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
    this.key = null
    this.keyrings = []
    cb()
  }

  exportAccount(address, cb) {
    cb(null, '0xPrivateKey')
  }

  tryPassword(password, cb) {
    cb()
  }

  getNetwork(err) {
    if (err) {
      this.network = 'loading'
      this.emit('update')
    }

    this.web3.version.getNetwork((err, network) => {
      if (err) {
        this.network = 'loading'
        return this.emit('update')
      }
      if (global.METAMASK_DEBUG) {
        console.log('web3.getNetwork returned ' + network)
      }
      this.network = network
      this.emit('update')
    })
  }

  addGasBuffer(gasHex) {
    var gas = new BN(gasHex, 16)
    var buffer = new BN('100000', 10)
    var result = gas.add(buffer)
    return ethUtil.addHexPrefix(result.toString(16))
  }

  clearSeedWordCache(cb) {
    this.configManager.setSeedWords(null)
    cb(null, this.configManager.getSelectedAccount())
  }

}

function noop () {}
