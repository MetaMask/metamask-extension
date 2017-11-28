const EventEmitter = require('events')
const extend = require('xtend')
const pump = require('pump')
const Dnode = require('dnode')
const ObservableStore = require('obs-store')
const AccountTracker = require('./lib/account-tracker')
const EthQuery = require('eth-query')
const RpcEngine = require('json-rpc-engine')
const debounce = require('debounce')
const createEngineStream = require('json-rpc-middleware-stream/engineStream')
const createFilterMiddleware = require('eth-json-rpc-filters')
const createOriginMiddleware = require('./lib/createOriginMiddleware')
const createLoggerMiddleware = require('./lib/createLoggerMiddleware')
const createProviderMiddleware = require('./lib/createProviderMiddleware')
const setupMultiplex = require('./lib/stream-utils.js').setupMultiplex
const KeyringController = require('eth-keyring-controller')
const NetworkController = require('./controllers/network')
const PreferencesController = require('./controllers/preferences')
const CurrencyController = require('./controllers/currency')
const NoticeController = require('./notice-controller')
const ShapeShiftController = require('./controllers/shapeshift')
const AddressBookController = require('./controllers/address-book')
const InfuraController = require('./controllers/infura')
const BlacklistController = require('./controllers/blacklist')
const RecentBlocksController = require('./controllers/recent-blocks')
const MessageManager = require('./lib/message-manager')
const PersonalMessageManager = require('./lib/personal-message-manager')
const TypedMessageManager = require('./lib/typed-message-manager')
const TransactionController = require('./controllers/transactions')
const BalancesController = require('./controllers/computed-balances')
const ConfigManager = require('./lib/config-manager')
const nodeify = require('./lib/nodeify')
const accountImporter = require('./account-import-strategies')
const getBuyEthUrl = require('./lib/buy-eth-url')
const version = require('../manifest.json').version

module.exports = class MetamaskController extends EventEmitter {

  constructor (opts) {
    super()

    this.sendUpdate = debounce(this.privateSendUpdate.bind(this), 200)

    this.opts = opts
    const initState = opts.initState || {}

    // platform-specific api
    this.platform = opts.platform

    // observable state store
    this.store = new ObservableStore(initState)

    // network store
    this.networkController = new NetworkController(initState.NetworkController)

    // config manager
    this.configManager = new ConfigManager({
      store: this.store,
    })

    // preferences controller
    this.preferencesController = new PreferencesController({
      initState: initState.PreferencesController,
    })

    // currency controller
    this.currencyController = new CurrencyController({
      initState: initState.CurrencyController,
    })
    this.currencyController.updateConversionRate()
    this.currencyController.scheduleConversionInterval()

    // infura controller
    this.infuraController = new InfuraController({
      initState: initState.InfuraController,
    })
    this.infuraController.scheduleInfuraNetworkCheck()

    this.blacklistController = new BlacklistController({
      initState: initState.BlacklistController,
    })
    this.blacklistController.scheduleUpdates()

    // rpc provider
    this.provider = this.initializeProvider()
    this.blockTracker = this.provider._blockTracker

    this.recentBlocks = new RecentBlocksController({
      blockTracker: this.blockTracker,
    })
    this.networkController.recentBlocks = this.recentBlocks

    // eth data query tools
    this.ethQuery = new EthQuery(this.provider)
    // account tracker watches balances, nonces, and any code at their address.
    this.accountTracker = new AccountTracker({
      provider: this.provider,
      blockTracker: this.blockTracker,
    })

    // key mgmt
    this.keyringController = new KeyringController({
      initState: initState.KeyringController,
      getNetwork: this.networkController.getNetworkState.bind(this.networkController),
      encryptor: opts.encryptor || undefined,
    })

    // If only one account exists, make sure it is selected.
    this.keyringController.memStore.subscribe((state) => {
      const addresses = state.keyrings.reduce((res, keyring) => {
        return res.concat(keyring.accounts)
      }, [])
      if (addresses.length === 1) {
        const address = addresses[0]
        this.preferencesController.setSelectedAddress(address)
      }
      this.accountTracker.syncWithAddresses(addresses)
    })

    // address book controller
    this.addressBookController = new AddressBookController({
      initState: initState.AddressBookController,
    }, this.keyringController)

    // tx mgmt
    this.txController = new TransactionController({
      initState: initState.TransactionController || initState.TransactionManager,
      networkStore: this.networkController.networkStore,
      preferencesStore: this.preferencesController.store,
      txHistoryLimit: 40,
      getNetwork: this.networkController.getNetworkState.bind(this),
      signTransaction: this.keyringController.signTransaction.bind(this.keyringController),
      provider: this.provider,
      blockTracker: this.blockTracker,
      ethQuery: this.ethQuery,
    })
    this.txController.on('newUnapprovedTx', opts.showUnapprovedTx.bind(opts))
    this.networkController.txController = this.txController
    this.networkController.on('providerWasRemotelyChanged', () => {
      this.txController.clearTxs()
      this.balancesController.updateAllBalances()
    })

    // computed balances (accounting for pending transactions)
    this.balancesController = new BalancesController({
      accountTracker: this.accountTracker,
      txController: this.txController,
      blockTracker: this.blockTracker,
    })
    this.networkController.on('networkDidChange', () => {
      this.balancesController.updateAllBalances()
    })
    this.networkController.on('userChangedNetwork', () => {
      this.recentBlocks.resetState()
      this.balancesController.updateAllBalances()
    })
    this.balancesController.updateAllBalances()

    // notices
    this.noticeController = new NoticeController({
      initState: initState.NoticeController,
    })
    this.noticeController.updateNoticesList()
    // to be uncommented when retrieving notices from a remote server.
    // this.noticeController.startPolling()

    this.shapeshiftController = new ShapeShiftController({
      initState: initState.ShapeShiftController,
    })

    this.networkController.lookupNetwork()
    this.messageManager = new MessageManager()
    this.personalMessageManager = new PersonalMessageManager()
    this.typedMessageManager = new TypedMessageManager()
    this.publicConfigStore = this.initPublicConfigStore()

    // manual disk state subscriptions
    this.txController.store.subscribe((state) => {
      this.store.updateState({ TransactionController: state })
    })
    this.keyringController.store.subscribe((state) => {
      this.store.updateState({ KeyringController: state })
    })
    this.preferencesController.store.subscribe((state) => {
      this.store.updateState({ PreferencesController: state })
    })
    this.addressBookController.store.subscribe((state) => {
      this.store.updateState({ AddressBookController: state })
    })
    this.currencyController.store.subscribe((state) => {
      this.store.updateState({ CurrencyController: state })
    })
    this.noticeController.store.subscribe((state) => {
      this.store.updateState({ NoticeController: state })
    })
    this.shapeshiftController.store.subscribe((state) => {
      this.store.updateState({ ShapeShiftController: state })
    })
    this.networkController.store.subscribe((state) => {
      this.store.updateState({ NetworkController: state })
    })
    this.blacklistController.store.subscribe((state) => {
      this.store.updateState({ BlacklistController: state })
    })
    this.recentBlocks.store.subscribe((state) => {
      this.store.updateState({ RecentBlocks: state })
    })
    this.infuraController.store.subscribe((state) => {
      this.store.updateState({ InfuraController: state })
    })

    // manual mem state subscriptions
    const sendUpdate = this.sendUpdate.bind(this)
    this.networkController.store.subscribe(sendUpdate)
    this.accountTracker.store.subscribe(sendUpdate)
    this.txController.memStore.subscribe(sendUpdate)
    this.balancesController.store.subscribe(sendUpdate)
    this.messageManager.memStore.subscribe(sendUpdate)
    this.personalMessageManager.memStore.subscribe(sendUpdate)
    this.typedMessageManager.memStore.subscribe(sendUpdate)
    this.keyringController.memStore.subscribe(sendUpdate)
    this.preferencesController.store.subscribe(sendUpdate)
    this.recentBlocks.store.subscribe(sendUpdate)
    this.addressBookController.store.subscribe(sendUpdate)
    this.currencyController.store.subscribe(sendUpdate)
    this.noticeController.memStore.subscribe(sendUpdate)
    this.shapeshiftController.store.subscribe(sendUpdate)
    this.infuraController.store.subscribe(sendUpdate)
  }

  //
  // Constructor helpers
  //

  initializeProvider () {
    const providerOpts = {
      static: {
        eth_syncing: false,
        web3_clientVersion: `MetaMask/v${version}`,
      },
      // account mgmt
      getAccounts: (cb) => {
        const isUnlocked = this.keyringController.memStore.getState().isUnlocked
        const result = []
        const selectedAddress = this.preferencesController.getSelectedAddress()

        // only show address if account is unlocked
        if (isUnlocked && selectedAddress) {
          result.push(selectedAddress)
        }
        cb(null, result)
      },
      // tx signing
      processTransaction: nodeify(async (txParams) => await this.txController.newUnapprovedTransaction(txParams), this),
      // old style msg signing
      processMessage: this.newUnsignedMessage.bind(this),
      // personal_sign msg signing
      processPersonalMessage: this.newUnsignedPersonalMessage.bind(this),
      processTypedMessage: this.newUnsignedTypedMessage.bind(this),
    }
    const providerProxy = this.networkController.initializeProvider(providerOpts)
    return providerProxy
  }

  initPublicConfigStore () {
    // get init state
    const publicConfigStore = new ObservableStore()

    // memStore -> transform -> publicConfigStore
    this.on('update', (memState) => {
      const publicState = selectPublicState(memState)
      publicConfigStore.putState(publicState)
    })

    function selectPublicState (memState) {
      const result = {
        selectedAddress: memState.isUnlocked ? memState.selectedAddress : undefined,
        networkVersion: memState.network,
      }
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
      this.networkController.store.getState(),
      this.accountTracker.store.getState(),
      this.txController.memStore.getState(),
      this.messageManager.memStore.getState(),
      this.personalMessageManager.memStore.getState(),
      this.typedMessageManager.memStore.getState(),
      this.keyringController.memStore.getState(),
      this.balancesController.store.getState(),
      this.preferencesController.store.getState(),
      this.addressBookController.store.getState(),
      this.currencyController.store.getState(),
      this.noticeController.memStore.getState(),
      this.infuraController.store.getState(),
      this.recentBlocks.store.getState(),
      // config manager
      this.configManager.getConfig(),
      this.shapeshiftController.store.getState(),
      {
        lostAccounts: this.configManager.getLostAccounts(),
        seedWords: this.configManager.getSeedWords(),
      }
    )
  }

  //
  // Remote Features
  //

  getApi () {
    const keyringController = this.keyringController
    const preferencesController = this.preferencesController
    const txController = this.txController
    const noticeController = this.noticeController
    const addressBookController = this.addressBookController
    const networkController = this.networkController

    return {
      // etc
      getState: (cb) => cb(null, this.getState()),
      setCurrentCurrency: this.setCurrentCurrency.bind(this),
      markAccountsFound: this.markAccountsFound.bind(this),

      // coinbase
      buyEth: this.buyEth.bind(this),
      // shapeshift
      createShapeShiftTx: this.createShapeShiftTx.bind(this),

      // primary HD keyring management
      addNewAccount: nodeify(this.addNewAccount, this),
      placeSeedWords: this.placeSeedWords.bind(this),
      clearSeedWordCache: this.clearSeedWordCache.bind(this),
      importAccountWithStrategy: this.importAccountWithStrategy.bind(this),

      // vault management
      submitPassword: nodeify(keyringController.submitPassword, keyringController),

      // network management
      setProviderType: nodeify(networkController.setProviderType, networkController),
      setCustomRpc: nodeify(this.setCustomRpc, this),

      // PreferencesController
      setSelectedAddress: nodeify(preferencesController.setSelectedAddress, preferencesController),
      addToken: nodeify(preferencesController.addToken, preferencesController),
      removeToken: nodeify(preferencesController.removeToken, preferencesController),
      setCurrentAccountTab: nodeify(preferencesController.setCurrentAccountTab, preferencesController),

      // AddressController
      setAddressBook: nodeify(addressBookController.setAddressBook, addressBookController),

      // KeyringController
      setLocked: nodeify(keyringController.setLocked, keyringController),
      createNewVaultAndKeychain: nodeify(this.createNewVaultAndKeychain, this),
      createNewVaultAndRestore: nodeify(this.createNewVaultAndRestore, this),
      addNewKeyring: nodeify(keyringController.addNewKeyring, keyringController),
      saveAccountLabel: nodeify(keyringController.saveAccountLabel, keyringController),
      exportAccount: nodeify(keyringController.exportAccount, keyringController),

      // txController
      cancelTransaction: nodeify(txController.cancelTransaction, txController),
      updateAndApproveTransaction: nodeify(txController.updateAndApproveTransaction, txController),

      // messageManager
      signMessage: nodeify(this.signMessage, this),
      cancelMessage: this.cancelMessage.bind(this),

      // personalMessageManager
      signPersonalMessage: nodeify(this.signPersonalMessage, this),
      cancelPersonalMessage: this.cancelPersonalMessage.bind(this),

      // personalMessageManager
      signTypedMessage: nodeify(this.signTypedMessage, this),
      cancelTypedMessage: this.cancelTypedMessage.bind(this),

      // notices
      checkNotices: noticeController.updateNoticesList.bind(noticeController),
      markNoticeRead: noticeController.markNoticeRead.bind(noticeController),
    }
  }

  setupUntrustedCommunication (connectionStream, originDomain) {
    // Check if new connection is blacklisted
    if (this.blacklistController.checkForPhishing(originDomain)) {
      log.debug('MetaMask - sending phishing warning for', originDomain)
      this.sendPhishingWarning(connectionStream, originDomain)
      return
    }

    // setup multiplexing
    const mux = setupMultiplex(connectionStream)
    // connect features
    this.setupProviderConnection(mux.createStream('provider'), originDomain)
    this.setupPublicConfig(mux.createStream('publicConfig'))
  }

  setupTrustedCommunication (connectionStream, originDomain) {
    // setup multiplexing
    const mux = setupMultiplex(connectionStream)
    // connect features
    this.setupControllerConnection(mux.createStream('controller'))
    this.setupProviderConnection(mux.createStream('provider'), originDomain)
  }

  sendPhishingWarning (connectionStream, hostname) {
    const mux = setupMultiplex(connectionStream)
    const phishingStream = mux.createStream('phishing')
    phishingStream.write({ hostname })
  }

  setupControllerConnection (outStream) {
    const api = this.getApi()
    const dnode = Dnode(api)
    pump(
      outStream,
      dnode,
      outStream,
      (err) => {
        if (err) log.error(err)
      }
    )
    dnode.on('remote', (remote) => {
      // push updates to popup
      const sendUpdate = remote.sendUpdate.bind(remote)
      this.on('update', sendUpdate)
    })
  }

  setupProviderConnection (outStream, origin) {
    // setup json rpc engine stack
    const engine = new RpcEngine()

    // create filter polyfill middleware
    const filterMiddleware = createFilterMiddleware({
      provider: this.provider,
      blockTracker: this.blockTracker,
    })

    engine.push(createOriginMiddleware({ origin }))
    engine.push(createLoggerMiddleware({ origin }))
    engine.push(filterMiddleware)
    engine.push(createProviderMiddleware({ provider: this.provider }))

    // setup connection
    const providerStream = createEngineStream({ engine })
    pump(
      outStream,
      providerStream,
      outStream,
      (err) => {
        // cleanup filter polyfill middleware
        filterMiddleware.destroy()
        if (err) log.error(err)
      }
    )
  }

  setupPublicConfig (outStream) {
    pump(
      this.publicConfigStore,
      outStream,
      (err) => {
        if (err) log.error(err)
      }
    )
  }

  privateSendUpdate () {
    this.emit('update', this.getState())
  }

  //
  // Vault Management
  //

  async createNewVaultAndKeychain (password, cb) {
    const vault = await this.keyringController.createNewVaultAndKeychain(password)
    this.selectFirstIdentity(vault)
    return vault
  }

  async createNewVaultAndRestore (password, seed, cb) {
    const vault = await this.keyringController.createNewVaultAndRestore(password, seed)
    this.selectFirstIdentity(vault)
    return vault
  }

  selectFirstIdentity (vault) {
    const { identities } = vault
    const address = Object.keys(identities)[0]
    this.preferencesController.setSelectedAddress(address)
  }

  //
  // Opinionated Keyring Management
  //

  async addNewAccount (cb) {
    const primaryKeyring = this.keyringController.getKeyringsByType('HD Key Tree')[0]
    if (!primaryKeyring) return cb(new Error('MetamaskController - No HD Key Tree found'))
    const keyringController = this.keyringController
    const oldAccounts = await keyringController.getAccounts()
    const keyState = await keyringController.addNewAccount(primaryKeyring)
    const newAccounts = await keyringController.getAccounts()

    newAccounts.forEach((address) => {
      if (!oldAccounts.includes(address)) {
        this.preferencesController.setSelectedAddress(address)
      }
    })

    return keyState
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
      cb(null, seedWords)
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

  newUnsignedMessage (msgParams, cb) {
    const msgId = this.messageManager.addUnapprovedMessage(msgParams)
    this.sendUpdate()
    this.opts.showUnconfirmedMessage()
    this.messageManager.once(`${msgId}:finished`, (data) => {
      switch (data.status) {
        case 'signed':
          return cb(null, data.rawSig)
        case 'rejected':
          return cb(new Error('MetaMask Message Signature: User denied message signature.'))
        default:
          return cb(new Error(`MetaMask Message Signature: Unknown problem: ${JSON.stringify(msgParams)}`))
      }
    })
  }

  newUnsignedPersonalMessage (msgParams, cb) {
    if (!msgParams.from) {
      return cb(new Error('MetaMask Message Signature: from field is required.'))
    }

    const msgId = this.personalMessageManager.addUnapprovedMessage(msgParams)
    this.sendUpdate()
    this.opts.showUnconfirmedMessage()
    this.personalMessageManager.once(`${msgId}:finished`, (data) => {
      switch (data.status) {
        case 'signed':
          return cb(null, data.rawSig)
        case 'rejected':
          return cb(new Error('MetaMask Message Signature: User denied message signature.'))
        default:
          return cb(new Error(`MetaMask Message Signature: Unknown problem: ${JSON.stringify(msgParams)}`))
      }
    })
  }

  newUnsignedTypedMessage (msgParams, cb) {
    let msgId
    try {
      msgId = this.typedMessageManager.addUnapprovedMessage(msgParams)
      this.sendUpdate()
      this.opts.showUnconfirmedMessage()
    } catch (e) {
      return cb(e)
    }

    this.typedMessageManager.once(`${msgId}:finished`, (data) => {
      switch (data.status) {
        case 'signed':
          return cb(null, data.rawSig)
        case 'rejected':
          return cb(new Error('MetaMask Message Signature: User denied message signature.'))
        default:
          return cb(new Error(`MetaMask Message Signature: Unknown problem: ${JSON.stringify(msgParams)}`))
      }
    })
  }

  signMessage (msgParams, cb) {
    log.info('MetaMaskController - signMessage')
    const msgId = msgParams.metamaskId

    // sets the status op the message to 'approved'
    // and removes the metamaskId for signing
    return this.messageManager.approveMessage(msgParams)
    .then((cleanMsgParams) => {
      // signs the message
      return this.keyringController.signMessage(cleanMsgParams)
    })
    .then((rawSig) => {
      // tells the listener that the message has been signed
      // and can be returned to the dapp
      this.messageManager.setMsgStatusSigned(msgId, rawSig)
      return this.getState()
    })
  }

  cancelMessage (msgId, cb) {
    const messageManager = this.messageManager
    messageManager.rejectMsg(msgId)
    if (cb && typeof cb === 'function') {
      cb(null, this.getState())
    }
  }

  // Prefixed Style Message Signing Methods:
  approvePersonalMessage (msgParams, cb) {
    const msgId = this.personalMessageManager.addUnapprovedMessage(msgParams)
    this.sendUpdate()
    this.opts.showUnconfirmedMessage()
    this.personalMessageManager.once(`${msgId}:finished`, (data) => {
      switch (data.status) {
        case 'signed':
          return cb(null, data.rawSig)
        case 'rejected':
          return cb(new Error('MetaMask Message Signature: User denied transaction signature.'))
        default:
          return cb(new Error(`MetaMask Message Signature: Unknown problem: ${JSON.stringify(msgParams)}`))
      }
    })
  }

  signPersonalMessage (msgParams) {
    log.info('MetaMaskController - signPersonalMessage')
    const msgId = msgParams.metamaskId
    // sets the status op the message to 'approved'
    // and removes the metamaskId for signing
    return this.personalMessageManager.approveMessage(msgParams)
    .then((cleanMsgParams) => {
      // signs the message
      return this.keyringController.signPersonalMessage(cleanMsgParams)
    })
    .then((rawSig) => {
      // tells the listener that the message has been signed
      // and can be returned to the dapp
      this.personalMessageManager.setMsgStatusSigned(msgId, rawSig)
      return this.getState()
    })
  }

  signTypedMessage (msgParams) {
    log.info('MetaMaskController - signTypedMessage')
    const msgId = msgParams.metamaskId
    // sets the status op the message to 'approved'
    // and removes the metamaskId for signing
    return this.typedMessageManager.approveMessage(msgParams)
      .then((cleanMsgParams) => {
        // signs the message
        return this.keyringController.signTypedMessage(cleanMsgParams)
      })
      .then((rawSig) => {
        // tells the listener that the message has been signed
        // and can be returned to the dapp
        this.typedMessageManager.setMsgStatusSigned(msgId, rawSig)
        return this.getState()
      })
  }

  cancelPersonalMessage (msgId, cb) {
    const messageManager = this.personalMessageManager
    messageManager.rejectMsg(msgId)
    if (cb && typeof cb === 'function') {
      cb(null, this.getState())
    }
  }

  cancelTypedMessage (msgId, cb) {
    const messageManager = this.typedMessageManager
    messageManager.rejectMsg(msgId)
    if (cb && typeof cb === 'function') {
      cb(null, this.getState())
    }
  }

  markAccountsFound (cb) {
    this.configManager.setLostAccounts([])
    this.sendUpdate()
    cb(null, this.getState())
  }

  restoreOldVaultAccounts (migratorOutput) {
    const { serialized } = migratorOutput
    return this.keyringController.restoreKeyring(serialized)
    .then(() => migratorOutput)
  }

  restoreOldLostAccounts (migratorOutput) {
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
  // config
  //

  // Log blocks

  setCurrentCurrency (currencyCode, cb) {
    try {
      this.currencyController.setCurrentCurrency(currencyCode)
      this.currencyController.updateConversionRate()
      const data = {
        conversionRate: this.currencyController.getConversionRate(),
        currentCurrency: this.currencyController.getCurrentCurrency(),
        conversionDate: this.currencyController.getConversionDate(),
      }
      cb(null, data)
    } catch (err) {
      cb(err)
    }
  }

  buyEth (address, amount) {
    if (!amount) amount = '5'
    const network = this.networkController.getNetworkState()
    const url = getBuyEthUrl({ network, address, amount })
    if (url) this.platform.openWindow({ url })
  }

  createShapeShiftTx (depositAddress, depositType) {
    this.shapeshiftController.createShapeShiftTx(depositAddress, depositType)
  }

  // network

  async setCustomRpc (rpcTarget, rpcList) {
    this.networkController.setRpcTarget(rpcTarget)
    await this.preferencesController.updateFrequentRpcList(rpcTarget)
    return rpcTarget
  }

}
