const EventEmitter = require('events')
const extend = require('xtend')
const promiseToCallback = require('promise-to-callback')
const pipe = require('pump')
const Dnode = require('dnode')
const ObservableStore = require('obs-store')
const EthStore = require('./lib/eth-store')
const EthQuery = require('eth-query')
const streamIntoProvider = require('web3-stream-provider/handler')
const setupMultiplex = require('./lib/stream-utils.js').setupMultiplex
const KeyringController = require('./keyring-controller')
const NetworkController = require('./controllers/network')
const PreferencesController = require('./controllers/preferences')
const CurrencyController = require('./controllers/currency')
const NoticeController = require('./notice-controller')
const ShapeShiftController = require('./controllers/shapeshift')
const AddressBookController = require('./controllers/address-book')
const MessageManager = require('./lib/message-manager')
const PersonalMessageManager = require('./lib/personal-message-manager')
const TransactionController = require('./controllers/transactions')
const ConfigManager = require('./lib/config-manager')
const autoFaucet = require('./lib/auto-faucet')
const nodeify = require('./lib/nodeify')
const accountImporter = require('./account-import-strategies')
const getBuyEthUrl = require('./lib/buy-eth-url')
const debounce = require('debounce')

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

    // rpc provider
    this.provider = this.initializeProvider()

    // eth data query tools
    this.ethQuery = new EthQuery(this.provider)
    this.ethStore = new EthStore({
      provider: this.provider,
      blockTracker: this.provider,
    })

    // key mgmt
    this.keyringController = new KeyringController({
      initState: initState.KeyringController,
      ethStore: this.ethStore,
      getNetwork: this.networkController.getNetworkState.bind(this.networkController),
    })
    this.keyringController.on('newAccount', (address) => {
      this.preferencesController.setSelectedAddress(address)
    })
    this.keyringController.on('newVault', (address) => {
      autoFaucet(address)
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
      blockTracker: this.provider,
      ethQuery: this.ethQuery,
      ethStore: this.ethStore,
    })

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

    // manual mem state subscriptions
    this.networkController.store.subscribe(this.sendUpdate.bind(this))
    this.ethStore.subscribe(this.sendUpdate.bind(this))
    this.txController.memStore.subscribe(this.sendUpdate.bind(this))
    this.messageManager.memStore.subscribe(this.sendUpdate.bind(this))
    this.personalMessageManager.memStore.subscribe(this.sendUpdate.bind(this))
    this.keyringController.memStore.subscribe(this.sendUpdate.bind(this))
    this.preferencesController.store.subscribe(this.sendUpdate.bind(this))
    this.addressBookController.store.subscribe(this.sendUpdate.bind(this))
    this.currencyController.store.subscribe(this.sendUpdate.bind(this))
    this.noticeController.memStore.subscribe(this.sendUpdate.bind(this))
    this.shapeshiftController.store.subscribe(this.sendUpdate.bind(this))
  }

  //
  // Constructor helpers
  //

  initializeProvider () {
    return this.networkController.initializeProvider({
      static: {
        eth_syncing: false,
        web3_clientVersion: `MetaMask/v${version}`,
      },
      rpcUrl: this.networkController.getCurrentRpcAddress(),
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
      processTransaction: (txParams, cb) => this.newUnapprovedTransaction(txParams, cb),
      // old style msg signing
      processMessage: this.newUnsignedMessage.bind(this),

      // new style msg signing
      processPersonalMessage: this.newUnsignedPersonalMessage.bind(this),
    })
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
      this.ethStore.getState(),
      this.txController.memStore.getState(),
      this.messageManager.memStore.getState(),
      this.personalMessageManager.memStore.getState(),
      this.keyringController.memStore.getState(),
      this.preferencesController.store.getState(),
      this.addressBookController.store.getState(),
      this.currencyController.store.getState(),
      this.noticeController.memStore.getState(),
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

    return {
      // etc
      getState: (cb) => cb(null, this.getState()),
      setProviderType: this.networkController.setProviderType.bind(this.networkController),
      setCurrentCurrency: this.setCurrentCurrency.bind(this),
      markAccountsFound: this.markAccountsFound.bind(this),
      // coinbase
      buyEth: this.buyEth.bind(this),
      // shapeshift
      createShapeShiftTx: this.createShapeShiftTx.bind(this),

      // primary HD keyring management
      addNewAccount: this.addNewAccount.bind(this),
      placeSeedWords: this.placeSeedWords.bind(this),
      clearSeedWordCache: this.clearSeedWordCache.bind(this),
      importAccountWithStrategy: this.importAccountWithStrategy.bind(this),

      // vault management
      submitPassword: this.submitPassword.bind(this),

      // PreferencesController
      setSelectedAddress: nodeify(preferencesController.setSelectedAddress).bind(preferencesController),
      setDefaultRpc: nodeify(this.setDefaultRpc).bind(this),
      setCustomRpc: nodeify(this.setCustomRpc).bind(this),

      // AddressController
      setAddressBook: nodeify(addressBookController.setAddressBook).bind(addressBookController),

      // KeyringController
      setLocked: nodeify(keyringController.setLocked).bind(keyringController),
      createNewVaultAndKeychain: nodeify(keyringController.createNewVaultAndKeychain).bind(keyringController),
      createNewVaultAndRestore: nodeify(keyringController.createNewVaultAndRestore).bind(keyringController),
      addNewKeyring: nodeify(keyringController.addNewKeyring).bind(keyringController),
      saveAccountLabel: nodeify(keyringController.saveAccountLabel).bind(keyringController),
      exportAccount: nodeify(keyringController.exportAccount).bind(keyringController),

      // txController
      approveTransaction: txController.approveTransaction.bind(txController),
      cancelTransaction: txController.cancelTransaction.bind(txController),
      updateAndApproveTransaction: this.updateAndApproveTx.bind(this),

      // messageManager
      signMessage: nodeify(this.signMessage).bind(this),
      cancelMessage: this.cancelMessage.bind(this),

      // personalMessageManager
      signPersonalMessage: nodeify(this.signPersonalMessage).bind(this),
      cancelPersonalMessage: this.cancelPersonalMessage.bind(this),

      // notices
      checkNotices: noticeController.updateNoticesList.bind(noticeController),
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
      log.info(`RPC (${originDomain}):`, request, '->', response)
    }
  }

  setupPublicConfig (outStream) {
    pipe(
      this.publicConfigStore,
      outStream
    )
  }

  privateSendUpdate () {
    this.emit('update', this.getState())
  }

  //
  // Vault Management
  //

  submitPassword (password, cb) {
    return this.keyringController.submitPassword(password)
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

  newUnapprovedTransaction (txParams, cb) {
    log.debug(`MetaMaskController newUnapprovedTransaction ${JSON.stringify(txParams)}`)
    const self = this
    self.txController.addUnapprovedTransaction(txParams, (err, txMeta) => {
      if (err) return cb(err)
      self.sendUpdate()
      self.opts.showUnapprovedTx(txMeta)
      // listen for tx completion (success, fail)
      self.txController.once(`${txMeta.id}:finished`, (completedTx) => {
        switch (completedTx.status) {
          case 'submitted':
            return cb(null, completedTx.hash)
          case 'rejected':
            return cb(new Error('MetaMask Tx Signature: User denied transaction signature.'))
          default:
            return cb(new Error(`MetaMask Tx Signature: Unknown problem: ${JSON.stringify(completedTx.txParams)}`))
        }
      })
    })
  }

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

  updateAndApproveTx (txMeta, cb) {
    log.debug(`MetaMaskController - updateAndApproveTx: ${JSON.stringify(txMeta)}`)
    const txController = this.txController
    txController.updateTx(txMeta)
    txController.approveTransaction(txMeta.id, cb)
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

  cancelPersonalMessage (msgId, cb) {
    const messageManager = this.personalMessageManager
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

  setDefaultRpc () {
    this.networkController.setRpcTarget('http://localhost:8545')
    return Promise.resolve('http://localhost:8545')
  }

  setCustomRpc (rpcTarget, rpcList) {
    this.networkController.setRpcTarget(rpcTarget)

    return this.preferencesController.updateFrequentRpcList(rpcTarget)
    .then(() => {
      return Promise.resolve(rpcTarget)
    })
  }


}
