const async = require('async')
const bind = require('ap').partial
const ethUtil = require('ethereumjs-util')
const ethBinToOps = require('eth-bin-to-ops')
const EthQuery = require('eth-query')
const bip39 = require('bip39')
const Transaction = require('ethereumjs-tx')
const EventEmitter = require('events').EventEmitter

const normalize = require('./lib/sig-util').normalize
const encryptor = require('./lib/encryptor')
const messageManager = require('./lib/message-manager')
const IdStoreMigrator = require('./lib/idStore-migrator')
const BN = ethUtil.BN

// Keyrings:
const SimpleKeyring = require('./keyrings/simple')
const HdKeyring = require('./keyrings/hd')
const keyringTypes = [
  SimpleKeyring,
  HdKeyring,
]

const createId = require('./lib/random-id')

module.exports = class KeyringController extends EventEmitter {

  constructor (opts) {
    super()
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
      isUnlocked: Boolean(this.password),
      isDisclaimerConfirmed: this.configManager.getConfirmedDisclaimer(), // AUDIT this.configManager.getConfirmedDisclaimer(),
      unconfTxs: this.configManager.unconfirmedTxs(),
      transactions: this.configManager.getTxList(),
      unconfMsgs: messageManager.unconfirmedMsgs(),
      messages: messageManager.getMsgList(),
      selectedAccount: address,
      shapeShiftTxList: this.configManager.getShapeShiftTxList(),
      currentFiat: this.configManager.getCurrentFiat(),
      conversionRate: this.configManager.getConversionRate(),
      conversionDate: this.configManager.getConversionDate(),
      keyringTypes: this.keyringTypes.map(krt => krt.type),
      identities: this.identities,
    }
  }

  setStore (ethStore) {
    this.ethStore = ethStore
  }

  createNewVaultAndKeychain (password, cb) {
    this.createNewVault(password, (err) => {
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

    this.createNewVault(password, (err) => {
      if (err) return cb(err)
      this.addNewKeyring('HD Key Tree', {
        mnemonic: seed,
        numberOfAccounts: 1,
      }, (err) => {
        if (err) return cb(err)
        const firstKeyring = this.keyrings[0]
        const accounts = firstKeyring.getAccounts()
        const firstAccount = accounts[0]
        const hexAccount = normalize(firstAccount)
        this.configManager.setSelectedAccount(hexAccount)
        this.setupAccounts(accounts)

        this.emit('update')
        cb()
      })
    })
  }

  migrateOldVaultIfAny (password) {
    const shouldMigrate = !!this.configManager.getWallet() && !this.configManager.getVault()
    return this.idStoreMigrator.migratedVaultForPassword(password)
    .then((serialized) => {
      if (serialized && shouldMigrate) {
        this.password = password
        const keyring = this.restoreKeyring(serialized)
        this.keyrings.push(keyring)
        keyring.getAccounts()
        .then((accounts) => {
          this.configManager.setSelectedAccount(accounts[0])
          return this.persistAllKeyrings()
        })
      }
      return Promise.resolve()
    })
  }

  createNewVault (password, cb) {
    return this.migrateOldVaultIfAny(password)
    .then(() => {
      this.password = password
      return this.persistAllKeyrings()
    })
    .then(() => {
      cb()
    })
    .catch((err) => {
      cb(err)
    })
  }

  createFirstKeyTree (password, cb) {
    this.clearKeyrings()
    this.addNewKeyring('HD Key Tree', {numberOfAccounts: 1}, (err) => {
      const accounts = this.keyrings[0].getAccounts()
      const firstAccount = accounts[0]
      const hexAccount = normalize(firstAccount)
      this.configManager.setSelectedAccount(firstAccount)

      this.placeSeedWords()
      this.emit('newAccount', hexAccount)
      this.setupAccounts(accounts)
      this.persistAllKeyrings()
      .then(() => {
        cb(err)
      })
      .catch((reason) => {
        cb(reason)
      })
    })
  }

  placeSeedWords (cb) {
    const firstKeyring = this.keyrings[0]
    firstKeyring.serialize()
    .then((serialized) => {

      const seedWords = serialized.mnemonic
      this.configManager.setSeedWords(seedWords)

      if (cb) {
        cb()
      }

      this.emit('update')
    })
  }

  submitPassword (password, cb) {
    this.migrateOldVaultIfAny(password)
    .then(() => {
      return this.unlockKeyrings(password)
    })
    .then((keyrings) => {
      this.keyrings = keyrings
      this.setupAccounts()
      this.emit('update')
      cb(null, this.getState())
    })
    .catch((err) => {
      cb(err)
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
      cb()
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
      cb()
    })
    .catch((reason) => {
      cb(reason)
    })
  }

  setupAccounts (accounts) {
    var arr = accounts || this.getAccounts()
    arr.forEach((account) => {
      this.getBalanceAndNickname(account)
    })
  }

  // Takes an account address and an iterator representing
  // the current number of named accounts.
  getBalanceAndNickname (account) {
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
    Promise.all(this.keyrings.map((keyring) => {
      return Promise.all([keyring.type, keyring.serialize()])
      .then((serializedKeyringArray) => {
        // Label the output values on each serialized Keyring:
        return {
          type: serializedKeyringArray[0],
          data: serializedKeyringArray[1],
        }
      })
    }))
    .then((serializedKeyrings) => {
      return this.encryptor.encrypt(this.password, serializedKeyrings)
    })
    .then((encryptedString) => {
      this.configManager.setVault(encryptedString)
      return true
    })
  }

  unlockKeyrings (password) {
    const encryptedVault = this.configManager.getVault()
    return this.encryptor.decrypt(password, encryptedVault)
    .then((vault) => {
      this.password = password
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
      if (kr.type === type) {
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

  setSelectedAccount (address, cb) {
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
      analyzeGasUsage,
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

    function analyzeGasUsage (cb) {
      query.getBlockByNumber('latest', true, function (err, block) {
        if (err) return cb(err)
        async.waterfall([
          bind(estimateGas, txData, block.gasLimit),
          bind(checkForGasError, txData),
          bind(setTxGas, txData, block.gasLimit),
        ], cb)
      })
    }

    function estimateGas (txData, blockGasLimitHex, cb) {
      const txParams = txData.txParams
      // check if gasLimit is already specified
      txData.gasLimitSpecified = Boolean(txParams.gas)
      // if not, fallback to block gasLimit
      if (!txData.gasLimitSpecified) {
        txParams.gas = blockGasLimitHex
      }
      // run tx, see if it will OOG
      query.estimateGas(txParams, cb)
    }

    function checkForGasError (txData, estimatedGasHex) {
      txData.estimatedGas = estimatedGasHex
      // all gas used - must be an error
      if (estimatedGasHex === txData.txParams.gas) {
        txData.simulationFails = true
      }
      cb()
    }

    function setTxGas (txData, blockGasLimitHex) {
      const txParams = txData.txParams
      // if OOG, nothing more to do
      if (txData.simulationFails) {
        cb()
        return
      }
      // if gasLimit was specified and doesnt OOG,
      // use original specified amount
      if (txData.gasLimitSpecified) {
        txData.estimatedGas = txParams.gas
        cb()
        return
      }
      // if gasLimit not originally specified,
      // try adding an additional gas buffer to our estimation for safety
      const estimatedGasBn = new BN(ethUtil.stripHexPrefix(txData.estimatedGas), 16)
      const blockGasLimitBn = new BN(ethUtil.stripHexPrefix(blockGasLimitHex), 16)
      const estimationWithBuffer = self.addGasBuffer(estimatedGasBn)
      // added gas buffer is too high
      if (estimationWithBuffer.gt(blockGasLimitBn)) {
        txParams.gas = txData.estimatedGas
      // added gas buffer is safe
      } else {
        const gasWithBufferHex = ethUtil.intToHex(estimationWithBuffer)
        txParams.gas = gasWithBufferHex
      }
      cb()
      return
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
    this.password = null
    this.keyrings = []
    this.emit('update')
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

function noop () {}
