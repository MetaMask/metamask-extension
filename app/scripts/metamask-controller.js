const EventEmitter = require('events')
const extend = require('xtend')
const promiseToCallback = require('promise-to-callback')
const pipe = require('pump')
const Dnode = require('dnode')
const ObservableStore = require('obs-store')
const storeTransform = require('obs-store/lib/transform')
const EthStore = require('./lib/eth-store')
const EthQuery = require('eth-query')
const streamIntoProvider = require('web3-stream-provider/handler')
const MetaMaskProvider = require('web3-provider-engine/zero.js')
const setupMultiplex = require('./lib/stream-utils.js').setupMultiplex
const KeyringController = require('./keyring-controller')
const PreferencesController = require('./lib/controllers/preferences')
const NoticeController = require('./notice-controller')
const messageManager = require('./lib/message-manager')
const TxManager = require('./transaction-manager')
const ConfigManager = require('./lib/config-manager')
const extension = require('./lib/extension')
const autoFaucet = require('./lib/auto-faucet')
const nodeify = require('./lib/nodeify')
const IdStoreMigrator = require('./lib/idStore-migrator')
const accountImporter = require('./account-import-strategies')

const version = require('../manifest.json').version

module.exports = class MetamaskController extends EventEmitter {

  constructor (opts) {
    super()
    this.opts = opts
    this.state = { network: 'loading' }
    let initState = opts.initState || {}

    // observable state store
    this.store = new ObservableStore(initState)
    
    // config manager
    this.configManager = new ConfigManager({
      store: this.store,
    })
    this.configManager.updateConversionRate()

    // preferences controller
    this.preferencesController = new PreferencesController({
      initState: initState.PreferencesController,
    })

    // rpc provider
    this.provider = this.initializeProvider(opts)
    this.provider.on('block', this.logBlock.bind(this))
    this.provider.on('error', this.getNetwork.bind(this))

    // eth data query tools
    this.ethQuery = new EthQuery(this.provider)
    this.ethStore = new EthStore(this.provider)
    
    // key mgmt
    this.keyringController = new KeyringController({
      initState: initState.KeyringController,
      ethStore: this.ethStore,
      configManager: this.configManager,
      getNetwork: this.getStateNetwork.bind(this),
    })
    this.keyringController.on('newAccount', (address) => {
      this.preferencesController.setSelectedAddress(address)
      autoFaucet(address)
    })

    // tx mgmt
    this.txManager = new TxManager({
      txList: this.configManager.getTxList(),
      txHistoryLimit: 40,
      setTxList: this.configManager.setTxList.bind(this.configManager),
      getSelectedAddress: this.preferencesController.getSelectedAddress.bind(this.preferencesController),
      getGasMultiplier: this.configManager.getGasMultiplier.bind(this.configManager),
      getNetwork: this.getStateNetwork.bind(this),
      signTransaction: this.keyringController.signTransaction.bind(this.keyringController),
      provider: this.provider,
      blockTracker: this.provider,
    })
    
    // notices
    this.noticeController = new NoticeController({
      configManager: this.configManager,
    })
    this.noticeController.updateNoticesList()
    // to be uncommented when retrieving notices from a remote server.
    // this.noticeController.startPolling()

    this.getNetwork()
    this.messageManager = messageManager
    this.publicConfigStore = this.initPublicConfigStore()

    this.checkTOSChange()

    this.scheduleConversionInterval()

    // TEMPORARY UNTIL FULL DEPRECATION:
    this.idStoreMigrator = new IdStoreMigrator({
      configManager: this.configManager,
    })

    // manual state subscriptions
    this.ethStore.on('update', this.sendUpdate.bind(this))
    this.keyringController.on('update', this.sendUpdate.bind(this))
    this.txManager.on('update', this.sendUpdate.bind(this))
    this.keyringController.store.subscribe((state) => {
      this.store.updateState({ KeyringController: state })
    })
    this.preferencesController.store.subscribe((state) => {
      this.store.updateState({ PreferencesController: state })
    })
  }

  //
  // Constructor helpers
  //

  initializeProvider () {
    let provider = MetaMaskProvider({
      static: {
        eth_syncing: false,
        web3_clientVersion: `MetaMask/v${version}`,
      },
      rpcUrl: this.configManager.getCurrentRpcAddress(),
      // account mgmt
      getAccounts: (cb) => {
        let selectedAddress = this.preferencesController.getSelectedAddress()
        let result = selectedAddress ? [selectedAddress] : []
        cb(null, result)
      },
      // tx signing
      processTransaction: (txParams, cb) => this.newUnapprovedTransaction(txParams, cb),
      // msg signing
      approveMessage: this.newUnsignedMessage.bind(this),
      signMessage: (...args) => {
        this.keyringController.signMessage(...args)
        this.sendUpdate()
      },
    })
    return provider
  }

  initPublicConfigStore () {
    // get init state
    const publicConfigStore = new ObservableStore()

    // sync publicConfigStore with transform
    pipe(
      this.store,
      storeTransform(selectPublicState),
      publicConfigStore
    )

    function selectPublicState(state) {
      const result = { selectedAddress: undefined }
      try {
        result.selectedAddress = state.PreferencesController.selectedAddress
      } catch (_) {}
      return result
    }

    return publicConfigStore
  }

  //
  // State Management
  //

  getState () {
    const wallet = this.configManager.getWallet()
    const vault = this.keyringController.store.getState().vault
    const isInitialized = (!!wallet || !!vault)
    return extend(
      {
        isInitialized,
      },
      this.state,
      this.ethStore.getState(),
      this.txManager.getState(),
      this.keyringController.getState(),
      this.preferencesController.store.getState(),
      this.noticeController.getState(),
      // config manager
      this.configManager.getConfig(),
      {
        shapeShiftTxList: this.configManager.getShapeShiftTxList(),
        lostAccounts: this.configManager.getLostAccounts(),
        currentFiat: this.configManager.getCurrentFiat(),
        conversionRate: this.configManager.getConversionRate(),
        conversionDate: this.configManager.getConversionDate(),
      }
    )
  }

  //
  // Remote Features
  //

  getApi () {
    const keyringController = this.keyringController
    const preferencesController = this.preferencesController
    const txManager = this.txManager
    const noticeController = this.noticeController

    return {
      // etc
      getState:              (cb) => cb(null, this.getState()),
      setRpcTarget:          this.setRpcTarget.bind(this),
      setProviderType:       this.setProviderType.bind(this),
      useEtherscanProvider:  this.useEtherscanProvider.bind(this),
      agreeToDisclaimer:     this.agreeToDisclaimer.bind(this),
      resetDisclaimer:       this.resetDisclaimer.bind(this),
      setCurrentFiat:        this.setCurrentFiat.bind(this),
      setTOSHash:            this.setTOSHash.bind(this),
      checkTOSChange:        this.checkTOSChange.bind(this),
      setGasMultiplier:      this.setGasMultiplier.bind(this),
      markAccountsFound:     this.markAccountsFound.bind(this),
      // coinbase
      buyEth: this.buyEth.bind(this),
      // shapeshift
      createShapeShiftTx: this.createShapeShiftTx.bind(this),
      
      // primary HD keyring management
      addNewAccount:              this.addNewAccount.bind(this),
      placeSeedWords:             this.placeSeedWords.bind(this),
      clearSeedWordCache:         this.clearSeedWordCache.bind(this),
      importAccountWithStrategy:  this.importAccountWithStrategy.bind(this),

      // vault management
      submitPassword: this.submitPassword.bind(this),

      // PreferencesController
      setSelectedAddress:        nodeify(preferencesController.setSelectedAddress).bind(preferencesController),

      // KeyringController
      setLocked:                 nodeify(keyringController.setLocked).bind(keyringController),
      createNewVaultAndKeychain: nodeify(keyringController.createNewVaultAndKeychain).bind(keyringController),
      createNewVaultAndRestore:  nodeify(keyringController.createNewVaultAndRestore).bind(keyringController),
      addNewKeyring:             nodeify(keyringController.addNewKeyring).bind(keyringController),
      saveAccountLabel:          nodeify(keyringController.saveAccountLabel).bind(keyringController),
      exportAccount:             nodeify(keyringController.exportAccount).bind(keyringController),

      // signing methods
      approveTransaction:    txManager.approveTransaction.bind(txManager),
      cancelTransaction:     txManager.cancelTransaction.bind(txManager),
      signMessage:           keyringController.signMessage.bind(keyringController),
      cancelMessage:         keyringController.cancelMessage.bind(keyringController),

      // notices
      checkNotices:   noticeController.updateNoticesList.bind(noticeController),
      markNoticeRead: noticeController.markNoticeRead.bind(noticeController),
    }
  }

  setupUntrustedCommunication (connectionStream, originDomain) {
    // setup multiplexing
    var mx = setupMultiplex(connectionStream)
    // connect features
    this.setupProviderConnection(mx.createStream('provider'), originDomain)
    this.setupPublicConfig(mx.createStream('publicConfig'))
  }

  setupTrustedCommunication (connectionStream, originDomain) {
    // setup multiplexing
    var mx = setupMultiplex(connectionStream)
    // connect features
    this.setupControllerConnection(mx.createStream('controller'))
    this.setupProviderConnection(mx.createStream('provider'), originDomain)
  }

  setupControllerConnection (outStream) {
    const api = this.getApi()
    const dnode = Dnode(api)
    outStream.pipe(dnode).pipe(outStream)
    dnode.on('remote', (remote) => {
      // push updates to popup
      const sendUpdate = remote.sendUpdate.bind(remote)
      this.on('update', sendUpdate)
    })
  }

  setupProviderConnection (outStream, originDomain) {
    streamIntoProvider(outStream, this.provider, logger)
    function logger (err, request, response) {
      if (err) return console.error(err)
      if (response.error) {
        console.error('Error in RPC response:\n', response.error)
      }
      if (request.isMetamaskInternal) return
      if (global.METAMASK_DEBUG) {
        console.log(`RPC (${originDomain}):`, request, '->', response)
      }
    }
  }

  setupPublicConfig (outStream) {
    pipe(
      this.publicConfigStore,
      outStream
    )
  }

  sendUpdate () {  
    this.emit('update', this.getState())
  }

  //
  // Vault Management
  //

  submitPassword (password, cb) {
    this.migrateOldVaultIfAny(password)
    .then(this.keyringController.submitPassword.bind(this.keyringController, password))
    .then((newState) => { cb(null, newState) })
    .catch((reason) => { cb(reason) })
  }

  //
  // Opinionated Keyring Management
  //

  addNewAccount (cb) {
    const primaryKeyring = this.keyringController.getKeyringsByType('HD Key Tree')[0]
    if (!primaryKeyring) return cb(new Error('MetamaskController - No HD Key Tree found'))
    promiseToCallback(this.keyringController.addNewAccount(primaryKeyring))(cb)
  }

  // Adds the current vault's seed words to the UI's state tree.
  //
  // Used when creating a first vault, to allow confirmation.
  // Also used when revealing the seed words in the confirmation view.
  placeSeedWords (cb) {
    const primaryKeyring = this.keyringController.getKeyringsByType('HD Key Tree')[0]
    if (!primaryKeyring) return cb(new Error('MetamaskController - No HD Key Tree found'))
    primaryKeyring.serialize()
    .then((serialized) => {
      const seedWords = serialized.mnemonic
      this.configManager.setSeedWords(seedWords)
      promiseToCallback(this.keyringController.fullUpdate())(cb)
    })
  }

  // ClearSeedWordCache
  //
  // Removes the primary account's seed words from the UI's state tree,
  // ensuring they are only ever available in the background process.
  clearSeedWordCache (cb) {
    this.configManager.setSeedWords(null)
    cb(null, this.preferencesController.getSelectedAddress())
  }

  importAccountWithStrategy (strategy, args, cb) {
    accountImporter.importAccount(strategy, args)
    .then((privateKey) => {
      return this.keyringController.addNewKeyring('Simple Key Pair', [ privateKey ])
    })
    .then(keyring => keyring.getAccounts())
    .then((accounts) => this.preferencesController.setSelectedAddress(accounts[0]))
    .then(() => { cb(null, this.keyringController.fullUpdate()) })
    .catch((reason) => { cb(reason) })
  }


  //
  // Identity Management
  //

  newUnapprovedTransaction (txParams, cb) {
    const self = this
    self.txManager.addUnapprovedTransaction(txParams, (err, txMeta) => {
      if (err) return cb(err)
      self.sendUpdate()
      self.opts.showUnapprovedTx(txMeta)
      // listen for tx completion (success, fail)
      self.txManager.once(`${txMeta.id}:finished`, (status) => {
        switch (status) {
          case 'submitted':
            return cb(null, txMeta.hash)
          case 'rejected':
            return cb(new Error('MetaMask Tx Signature: User denied transaction signature.'))
          default:
            return cb(new Error(`MetaMask Tx Signature: Unknown problem: ${JSON.stringify(txMeta.txParams)}`))
        }
      })
    })
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


  markAccountsFound (cb) {
    this.configManager.setLostAccounts([])
    this.sendUpdate()
    cb(null, this.getState())
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

    if (!this.checkIfShouldMigrate()) {
      return Promise.resolve(password)
    }

    const keyringController = this.keyringController

    return this.idStoreMigrator.migratedVaultForPassword(password)
    .then(this.restoreOldVaultAccounts.bind(this))
    .then(this.restoreOldLostAccounts.bind(this))
    .then(keyringController.persistAllKeyrings.bind(keyringController, password))
    .then(() => password)
  }

  checkIfShouldMigrate() {
    return !!this.configManager.getWallet() && !this.configManager.getVault()
  }

  restoreOldVaultAccounts(migratorOutput) {
    const { serialized } = migratorOutput
    return this.keyringController.restoreKeyring(serialized)
    .then(() => migratorOutput)
  }

  restoreOldLostAccounts(migratorOutput) {
    const { lostAccounts } = migratorOutput
    if (lostAccounts) {
      this.configManager.setLostAccounts(lostAccounts.map(acct => acct.address))
      return this.importLostAccounts(migratorOutput)
    }
    return Promise.resolve(migratorOutput)
  }

  // IMPORT LOST ACCOUNTS
  // @Object with key lostAccounts: @Array accounts <{ address, privateKey }>
  // Uses the array's private keys to create a new Simple Key Pair keychain
  // and add it to the keyring controller.
  importLostAccounts ({ lostAccounts }) {
    const privKeys = lostAccounts.map(acct => acct.privateKey)
    return this.keyringController.restoreKeyring({
      type: 'Simple Key Pair',
      data: privKeys,
    })
  }

  //
  // disclaimer
  //

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

  //
  // config
  //

  // Log blocks
  logBlock (block) {
    if (global.METAMASK_DEBUG) {
      console.log(`BLOCK CHANGED: #${block.number.toString('hex')} 0x${block.hash.toString('hex')}`)
    }
    this.verifyNetwork()
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

  setGasMultiplier (gasMultiplier, cb) {
    try {
      this.configManager.setGasMultiplier(gasMultiplier)
      cb()
    } catch (err) {
      cb(err)
    }
  }

  //
  // network
  //

  verifyNetwork () {
    // Check network when restoring connectivity:
    if (this.state.network === 'loading') {
      this.getNetwork()
    }
  }

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

  getStateNetwork () {
    return this.state.network
  }

  getNetwork (err) {
    if (err) {
      this.state.network = 'loading'
      this.sendUpdate()
    }

    this.ethQuery.sendAsync({ method: 'net_version' }, (err, network) => {
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

}
