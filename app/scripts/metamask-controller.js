const extend = require('xtend')
const EthStore = require('eth-store')
const MetaMaskProvider = require('web3-provider-engine/zero.js')
const KeyringController = require('./keyring-controller')
const NoticeController = require('./notice-controller')
const messageManager = require('./lib/message-manager')
const HostStore = require('./lib/remote-store.js').HostStore
const Web3 = require('web3')
const ConfigManager = require('./lib/config-manager')
const extension = require('./lib/extension')
const autoFaucet = require('./lib/auto-faucet')
const nodeify = require('./lib/nodeify')
const IdStoreMigrator = require('./lib/idStore-migrator')


module.exports = class MetamaskController {

  constructor (opts) {
    this.state = { network: 'loading' }
    this.opts = opts
    this.listeners = []
    this.configManager = new ConfigManager(opts)
    this.keyringController = new KeyringController({
      configManager: this.configManager,
      getNetwork: this.getStateNetwork.bind(this),
    })
    // notices
    this.noticeController = new NoticeController({
      configManager: this.configManager,
    })
    this.noticeController.updateNoticesList()
    // to be uncommented when retrieving notices from a remote server.
    // this.noticeController.startPolling()
    this.provider = this.initializeProvider(opts)
    this.ethStore = new EthStore(this.provider)
    this.keyringController.setStore(this.ethStore)
    this.getNetwork()
    this.messageManager = messageManager
    this.publicConfigStore = this.initPublicConfigStore()

    var currentFiat = this.configManager.getCurrentFiat() || 'USD'
    this.configManager.setCurrentFiat(currentFiat)
    this.configManager.updateConversionRate()

    this.checkTOSChange()

    this.scheduleConversionInterval()

    // TEMPORARY UNTIL FULL DEPRECATION:
    this.idStoreMigrator = new IdStoreMigrator({
      configManager: this.configManager,
    })
  }

  getState () {
    return extend(
      this.state,
      this.ethStore.getState(),
      this.configManager.getConfig(),
      this.keyringController.getState(),
      this.noticeController.getState(), {
        lostAccounts: this.configManager.getLostAccounts(),
      }
    )
  }

  getApi () {
    const keyringController = this.keyringController
    const noticeController = this.noticeController

    return {
      getState: (cb) => { cb(null, this.getState()) },
      setRpcTarget: this.setRpcTarget.bind(this),
      setProviderType: this.setProviderType.bind(this),
      useEtherscanProvider: this.useEtherscanProvider.bind(this),
      agreeToDisclaimer: this.agreeToDisclaimer.bind(this),
      resetDisclaimer: this.resetDisclaimer.bind(this),
      setCurrentFiat: this.setCurrentFiat.bind(this),
      setTOSHash: this.setTOSHash.bind(this),
      checkTOSChange: this.checkTOSChange.bind(this),
      setGasMultiplier: this.setGasMultiplier.bind(this),
      markAccountsFound: this.markAccountsFound.bind(this),

      // forward directly to keyringController
      createNewVaultAndKeychain: nodeify(keyringController.createNewVaultAndKeychain).bind(keyringController),
      createNewVaultAndRestore: nodeify(keyringController.createNewVaultAndRestore).bind(keyringController),
      placeSeedWords: nodeify(keyringController.placeSeedWords).bind(keyringController),
      clearSeedWordCache: nodeify(keyringController.clearSeedWordCache).bind(keyringController),
      setLocked: nodeify(keyringController.setLocked).bind(keyringController),
      submitPassword: (password, cb) => {
        this.migrateOldVaultIfAny(password)
        .then(keyringController.submitPassword.bind(keyringController))
        .then((newState) => { console.log('succeeded submitting!'); cb(null, newState) })
        .catch((reason) => { console.error(reason); cb(reason) })
      },
      addNewKeyring: nodeify(keyringController.addNewKeyring).bind(keyringController),
      addNewAccount: nodeify(keyringController.addNewAccount).bind(keyringController),
      setSelectedAccount: nodeify(keyringController.setSelectedAccount).bind(keyringController),
      saveAccountLabel: nodeify(keyringController.saveAccountLabel).bind(keyringController),
      exportAccount: nodeify(keyringController.exportAccount).bind(keyringController),

      // signing methods
      approveTransaction: keyringController.approveTransaction.bind(keyringController),
      cancelTransaction: keyringController.cancelTransaction.bind(keyringController),
      signMessage: keyringController.signMessage.bind(keyringController),
      cancelMessage: keyringController.cancelMessage.bind(keyringController),

      // coinbase
      buyEth: this.buyEth.bind(this),
      // shapeshift
      createShapeShiftTx: this.createShapeShiftTx.bind(this),
      // notices
      checkNotices: noticeController.updateNoticesList.bind(noticeController),
      markNoticeRead: noticeController.markNoticeRead.bind(noticeController),
    }
  }

  setupProviderConnection (stream, originDomain) {
    stream.on('data', this.onRpcRequest.bind(this, stream, originDomain))
  }

  onRpcRequest (stream, originDomain, request) {
    // handle rpc request
    this.provider.sendAsync(request, function onPayloadHandled (err, response) {
      logger(err, request, response)
      if (response) {
        try {
          stream.write(response)
        } catch (err) {
          logger(err)
        }
      }
    })

    function logger (err, request, response) {
      if (err) return console.error(err)
      if (!request.isMetamaskInternal) {
        if (global.METAMASK_DEBUG) {
          console.log(`RPC (${originDomain}):`, request, '->', response)
        }
        if (response.error) {
          console.error('Error in RPC response:\n', response.error)
        }
      }
    }
  }

  sendUpdate () {
    this.listeners.forEach((remote) => {
      remote.sendUpdate(this.getState())
    })
  }

  initializeProvider (opts) {
    const keyringController = this.keyringController

    var providerOpts = {
      rpcUrl: this.configManager.getCurrentRpcAddress(),
      // account mgmt
      getAccounts: (cb) => {
        var selectedAccount = this.configManager.getSelectedAccount()
        var result = selectedAccount ? [selectedAccount] : []
        cb(null, result)
      },
      // tx signing
      approveTransaction: this.newUnsignedTransaction.bind(this),
      signTransaction: (...args) => {
        keyringController.signTransaction(...args)
        this.sendUpdate()
      },

      // msg signing
      approveMessage: this.newUnsignedMessage.bind(this),
      signMessage: (...args) => {
        keyringController.signMessage(...args)
        this.sendUpdate()
      },
    }

    var provider = MetaMaskProvider(providerOpts)
    var web3 = new Web3(provider)
    this.web3 = web3
    keyringController.web3 = web3

    provider.on('block', this.processBlock.bind(this))
    provider.on('error', this.getNetwork.bind(this))

    return provider
  }

  initPublicConfigStore () {
    // get init state
    var initPublicState = extend(
      keyringControllerToPublic(this.keyringController.getState()),
      configToPublic(this.configManager.getConfig())
    )

    var publicConfigStore = new HostStore(initPublicState)

    // subscribe to changes
    this.configManager.subscribe(function (state) {
      storeSetFromObj(publicConfigStore, configToPublic(state))
    })
    this.keyringController.on('update', () => {
      const state = this.keyringController.getState()
      storeSetFromObj(publicConfigStore, keyringControllerToPublic(state))
      this.sendUpdate()
    })

    this.keyringController.on('newAccount', (account) => {
      autoFaucet(account)
    })

    // keyringController substate
    function keyringControllerToPublic (state) {
      return {
        selectedAccount: state.selectedAccount,
      }
    }
    // config substate
    function configToPublic (state) {
      return {
        provider: state.provider,
        selectedAccount: state.selectedAccount,
      }
    }
    // dump obj into store
    function storeSetFromObj (store, obj) {
      Object.keys(obj).forEach(function (key) {
        store.set(key, obj[key])
      })
    }

    return publicConfigStore
  }

  newUnsignedTransaction (txParams, onTxDoneCb) {
    const keyringController = this.keyringController
    const err = this.enforceTxValidations(txParams)
    if (err) return onTxDoneCb(err)
    keyringController.addUnconfirmedTransaction(txParams, onTxDoneCb, (err, txData) => {
      if (err) return onTxDoneCb(err)
      this.sendUpdate()
      this.opts.showUnconfirmedTx(txParams, txData, onTxDoneCb)
    })
  }

  enforceTxValidations (txParams) {
    if (('value' in txParams) && txParams.value.indexOf('-') === 0) {
      const msg = `Invalid transaction value of ${txParams.value} not a positive number.`
      return new Error(msg)
    }
  }

  newUnsignedMessage (msgParams, cb) {
    var state = this.keyringController.getState()
    if (!state.isUnlocked) {
      this.keyringController.addUnconfirmedMessage(msgParams, cb)
      this.opts.unlockAccountMessage()
    } else {
      this.addUnconfirmedMessage(msgParams, cb)
      this.sendUpdate()
    }
  }

  addUnconfirmedMessage (msgParams, cb) {
    const keyringController = this.keyringController
    const msgId = keyringController.addUnconfirmedMessage(msgParams, cb)
    this.opts.showUnconfirmedMessage(msgParams, msgId)
  }

  setupPublicConfig (stream) {
    var storeStream = this.publicConfigStore.createStream()
    stream.pipe(storeStream).pipe(stream)
  }

  // Log blocks
  processBlock (block) {
    if (global.METAMASK_DEBUG) {
      console.log(`BLOCK CHANGED: #${block.number.toString('hex')} 0x${block.hash.toString('hex')}`)
    }
    this.verifyNetwork()
  }

  verifyNetwork () {
    // Check network when restoring connectivity:
    if (this.state.network === 'loading') {
      this.getNetwork()
    }
  }

  // config
  //

  setTOSHash (hash) {
    try {
      this.configManager.setTOSHash(hash)
    } catch (err) {
      console.error('Error in setting terms of service hash.')
    }
  }

  checkTOSChange () {
    try {
      const storedHash = this.configManager.getTOSHash() || 0
      if (storedHash !== global.TOS_HASH) {
        this.resetDisclaimer()
        this.setTOSHash(global.TOS_HASH)
      }
    } catch (err) {
      console.error('Error in checking TOS change.')
    }
  }

  // disclaimer

  agreeToDisclaimer (cb) {
    try {
      this.configManager.setConfirmedDisclaimer(true)
      cb()
    } catch (err) {
      cb(err)
    }
  }

  resetDisclaimer () {
    try {
      this.configManager.setConfirmedDisclaimer(false)
    } catch (e) {
      console.error(e)
    }
  }

  setCurrentFiat (fiat, cb) {
    try {
      this.configManager.setCurrentFiat(fiat)
      this.configManager.updateConversionRate()
      this.scheduleConversionInterval()
      const data = {
        conversionRate: this.configManager.getConversionRate(),
        currentFiat: this.configManager.getCurrentFiat(),
        conversionDate: this.configManager.getConversionDate(),
      }
      cb(data)
    } catch (err) {
      cb(null, err)
    }
  }

  scheduleConversionInterval () {
    if (this.conversionInterval) {
      clearInterval(this.conversionInterval)
    }
    this.conversionInterval = setInterval(() => {
      this.configManager.updateConversionRate()
    }, 300000)
  }

  // called from popup
  setRpcTarget (rpcTarget) {
    this.configManager.setRpcTarget(rpcTarget)
    extension.runtime.reload()
    this.getNetwork()
  }

  setProviderType (type) {
    this.configManager.setProviderType(type)
    extension.runtime.reload()
    this.getNetwork()
  }

  useEtherscanProvider () {
    this.configManager.useEtherscanProvider()
    extension.runtime.reload()
  }

  buyEth (address, amount) {
    if (!amount) amount = '5'

    var network = this.state.network
    var url = `https://buy.coinbase.com/?code=9ec56d01-7e81-5017-930c-513daa27bb6a&amount=${amount}&address=${address}&crypto_currency=ETH`

    if (network === '3') {
      url = 'https://faucet.metamask.io/'
    }

    extension.tabs.create({
      url,
    })
  }

  createShapeShiftTx (depositAddress, depositType) {
    this.configManager.createShapeShiftTx(depositAddress, depositType)
  }

  getNetwork (err) {
    if (err) {
      this.state.network = 'loading'
      this.sendUpdate()
    }

    this.web3.version.getNetwork((err, network) => {
      if (err) {
        this.state.network = 'loading'
        return this.sendUpdate()
      }
      if (global.METAMASK_DEBUG) {
        console.log('web3.getNetwork returned ' + network)
      }
      this.state.network = network
      this.sendUpdate()
    })
  }

  setGasMultiplier (gasMultiplier, cb) {
    try {
      this.configManager.setGasMultiplier(gasMultiplier)
      cb()
    } catch (err) {
      cb(err)
    }
  }

  getStateNetwork () {
    return this.state.network
  }

  markAccountsFound(cb) {
    this.configManager.setLostAccounts([])
    this.keyringController.getAccounts()
    .then((accounts) => {
      return this.keyringController.setSelectedAccount(accounts[0])
    })
    .then(() => {
      this.sendUpdate()
      cb(null, this.getState())
    })
  }

  // Migrate Old Vault If Any
  // @string password
  //
  // returns Promise()
  //
  // Temporary step used when logging in.
  // Checks if old style (pre-3.0.0) Metamask Vault exists.
  // If so, persists that vault in the new vault format
  // with the provided password, so the other unlock steps
  // may be completed without interruption.
  migrateOldVaultIfAny (password) {
    const shouldMigrate = !!this.configManager.getWallet() && !this.configManager.getVault()
    if (!shouldMigrate) {
      return Promise.resolve(password)
    }

    return this.idStoreMigrator.migratedVaultForPassword(password)
    .then((result) => {

      this.keyringController.password = password
      const { serialized, lostAccounts } = result

      // Restore the correct accounts first:
      return this.keyringController.restoreKeyring(serialized)
      .then(keyring => keyring.getAccounts())
      .then((accounts) => {
        this.configManager.setSelectedAccount(accounts[0])
        return result
      })

    }).then((result) => {

      // Now we restore any lost accounts:
      const { serialized, lostAccounts } = result
      if (result && lostAccounts) {
        this.configManager.setLostAccounts(lostAccounts.map((acct) => acct.address))
        return this.importLostAccounts(result)
      }
      return Promise.resolve(result)
    }).then(() => {

      // Persist all these newly restored items to disk:
      return this.keyringController.persistAllKeyrings()

    // Ultimately pass the password back for normal unlocking:
    }).then((result) => password)
  }

  // IMPORT LOST ACCOUNTS
  // @Object with key lostAccounts: @Array accounts <{ address, privateKey }>
  // Uses the array's private keys to create a new Simple Key Pair keychain
  // and add it to the keyring controller.
  importLostAccounts (result) {
    const { serialized, lostAccounts } = result
    const privKeys = lostAccounts.map(acct => acct.privateKey)
    return this.keyringController.restoreKeyring({
      type: 'Simple Key Pair',
      data: privKeys,
    })
  }
}
