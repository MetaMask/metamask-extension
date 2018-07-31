/**
 * @file      The central metamask controller. Aggregates other controllers and exports an api.
 * @copyright Copyright (c) 2018 MetaMask
 * @license   MIT
 */

const EventEmitter = require('events')
const pump = require('pump')
const Dnode = require('dnode')
const ObservableStore = require('obs-store')
const ComposableObservableStore = require('./lib/ComposableObservableStore')
const asStream = require('obs-store/lib/asStream')
const AccountTracker = require('./lib/account-tracker')
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
const TokenRatesController = require('./controllers/token-rates')
const DetectTokensController = require('./controllers/detect-tokens')
const ConfigManager = require('./lib/config-manager')
const nodeify = require('./lib/nodeify')
const accountImporter = require('./account-import-strategies')
const getBuyEthUrl = require('./lib/buy-eth-url')
const Mutex = require('await-semaphore').Mutex
const version = require('../manifest.json').version
const BN = require('ethereumjs-util').BN
const GWEI_BN = new BN('1000000000')
const percentile = require('percentile')
const seedPhraseVerifier = require('./lib/seed-phrase-verifier')
const cleanErrorStack = require('./lib/cleanErrorStack')
const log = require('loglevel')
const TrezorKeyring = require('eth-trezor-keyring')

module.exports = class MetamaskController extends EventEmitter {

  /**
   * @constructor
   * @param {Object} opts
   */
   constructor (opts) {
    super()

    this.defaultMaxListeners = 20

    this.sendUpdate = debounce(this.privateSendUpdate.bind(this), 200)
    this.opts = opts
    const initState = opts.initState || {}
    this.recordFirstTimeInfo(initState)

    // platform-specific api
    this.platform = opts.platform

    // observable state store
    this.store = new ComposableObservableStore(initState)

    // lock to ensure only one vault created at once
    this.createVaultMutex = new Mutex()

    // network store
    this.networkController = new NetworkController(initState.NetworkController)

    // config manager
    this.configManager = new ConfigManager({
      store: this.store,
    })

    // preferences controller
    this.preferencesController = new PreferencesController({
      initState: initState.PreferencesController,
      initLangCode: opts.initLangCode,
      network: this.networkController,
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

    this.blacklistController = new BlacklistController()
    this.blacklistController.scheduleUpdates()

    // rpc provider
    this.provider = this.initializeProvider()
    this.blockTracker = this.provider._blockTracker

    // token exchange rate tracker
    this.tokenRatesController = new TokenRatesController({
      preferences: this.preferencesController.store,
    })

    this.recentBlocksController = new RecentBlocksController({
      blockTracker: this.blockTracker,
      provider: this.provider,
    })

    // account tracker watches balances, nonces, and any code at their address.
    this.accountTracker = new AccountTracker({
      provider: this.provider,
      blockTracker: this.blockTracker,
    })

    // key mgmt
    const additionalKeyrings = [TrezorKeyring]
    this.keyringController = new KeyringController({
      keyringTypes: additionalKeyrings,
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
      // ensure preferences + identities controller know about all addresses
      this.preferencesController.addAddresses(addresses)
      this.accountTracker.syncWithAddresses(addresses)
    })

    // detect tokens controller
    this.detectTokensController = new DetectTokensController({
      preferences: this.preferencesController,
      network: this.networkController,
      keyringMemStore: this.keyringController.memStore,
    })

    // address book controller
    this.addressBookController = new AddressBookController({
      initState: initState.AddressBookController,
      preferencesStore: this.preferencesController.store,
    })

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
      getGasPrice: this.getGasPrice.bind(this),
    })
    this.txController.on('newUnapprovedTx', opts.showUnapprovedTx.bind(opts))

    this.txController.on(`tx:status-update`, (txId, status) => {
      if (status === 'confirmed' || status === 'failed') {
        const txMeta = this.txController.txStateManager.getTx(txId)
        this.platform.showTransactionNotification(txMeta)
      }
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
    this.balancesController.updateAllBalances()

    // notices
    this.noticeController = new NoticeController({
      initState: initState.NoticeController,
      version,
      firstVersion: initState.firstTimeInfo.version,
    })

    this.shapeshiftController = new ShapeShiftController({
      initState: initState.ShapeShiftController,
    })

    this.networkController.lookupNetwork()
    this.messageManager = new MessageManager()
    this.personalMessageManager = new PersonalMessageManager()
    this.typedMessageManager = new TypedMessageManager()
    this.publicConfigStore = this.initPublicConfigStore()

    this.store.updateStructure({
      TransactionController: this.txController.store,
      KeyringController: this.keyringController.store,
      PreferencesController: this.preferencesController.store,
      AddressBookController: this.addressBookController.store,
      CurrencyController: this.currencyController.store,
      NoticeController: this.noticeController.store,
      ShapeShiftController: this.shapeshiftController.store,
      NetworkController: this.networkController.store,
      InfuraController: this.infuraController.store,
    })

    this.memStore = new ComposableObservableStore(null, {
      NetworkController: this.networkController.store,
      AccountTracker: this.accountTracker.store,
      TxController: this.txController.memStore,
      BalancesController: this.balancesController.store,
      TokenRatesController: this.tokenRatesController.store,
      MessageManager: this.messageManager.memStore,
      PersonalMessageManager: this.personalMessageManager.memStore,
      TypesMessageManager: this.typedMessageManager.memStore,
      KeyringController: this.keyringController.memStore,
      PreferencesController: this.preferencesController.store,
      RecentBlocksController: this.recentBlocksController.store,
      AddressBookController: this.addressBookController.store,
      CurrencyController: this.currencyController.store,
      NoticeController: this.noticeController.memStore,
      ShapeshiftController: this.shapeshiftController.store,
      InfuraController: this.infuraController.store,
    })
    this.memStore.subscribe(this.sendUpdate.bind(this))
  }

  /**
   * Constructor helper: initialize a provider.
   */
  initializeProvider () {
    const providerOpts = {
      static: {
        eth_syncing: false,
        web3_clientVersion: `MetaMask/v${version}`,
        eth_sendTransaction: (payload, next, end) => {
          const origin = payload.origin
          const txParams = payload.params[0]
          nodeify(this.txController.newUnapprovedTransaction, this.txController)(txParams, { origin }, end)
        },
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
      // old style msg signing
      processMessage: this.newUnsignedMessage.bind(this),
      // personal_sign msg signing
      processPersonalMessage: this.newUnsignedPersonalMessage.bind(this),
      processTypedMessage: this.newUnsignedTypedMessage.bind(this),
    }
    const providerProxy = this.networkController.initializeProvider(providerOpts)
    return providerProxy
  }

  /**
   * Constructor helper: initialize a public config store.
   * This store is used to make some config info available to Dapps synchronously.
   */
  initPublicConfigStore () {
    // get init state
    const publicConfigStore = new ObservableStore()

    // memStore -> transform -> publicConfigStore
    this.on('update', (memState) => {
      this.isClientOpenAndUnlocked = memState.isUnlocked && this._isClientOpen
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

//=============================================================================
// EXPOSED TO THE UI SUBSYSTEM
//=============================================================================

  /**
   * The metamask-state of the various controllers, made available to the UI
   *
   * @returns {Object} status
   */
  getState () {
    const wallet = this.configManager.getWallet()
    const vault = this.keyringController.store.getState().vault
    const isInitialized = (!!wallet || !!vault)

    return {
      ...{ isInitialized },
      ...this.memStore.getFlatState(),
      ...this.configManager.getConfig(),
      ...{
        lostAccounts: this.configManager.getLostAccounts(),
        seedWords: this.configManager.getSeedWords(),
        forgottenPassword: this.configManager.getPasswordForgotten(),
      },
    }
  }

  /**
   * Returns an Object containing API Callback Functions.
   * These functions are the interface for the UI.
   * The API object can be transmitted over a stream with dnode.
   *
   * @returns {Object} Object containing API functions.
   */
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
      setUseBlockie: this.setUseBlockie.bind(this),
      setCurrentLocale: this.setCurrentLocale.bind(this),
      markAccountsFound: this.markAccountsFound.bind(this),
      markPasswordForgotten: this.markPasswordForgotten.bind(this),
      unMarkPasswordForgotten: this.unMarkPasswordForgotten.bind(this),
      getGasPrice: (cb) => cb(null, this.getGasPrice()),

      // coinbase
      buyEth: this.buyEth.bind(this),
      // shapeshift
      createShapeShiftTx: this.createShapeShiftTx.bind(this),

      // primary HD keyring management
      addNewAccount: nodeify(this.addNewAccount, this),
      placeSeedWords: this.placeSeedWords.bind(this),
      verifySeedPhrase: nodeify(this.verifySeedPhrase, this),
      clearSeedWordCache: this.clearSeedWordCache.bind(this),
      resetAccount: nodeify(this.resetAccount, this),
      removeAccount: nodeify(this.removeAccount, this),
      importAccountWithStrategy: nodeify(this.importAccountWithStrategy, this),

      // hardware wallets
      connectHardware: nodeify(this.connectHardware, this),
      forgetDevice: nodeify(this.forgetDevice, this),
      checkHardwareStatus: nodeify(this.checkHardwareStatus, this),

      // TREZOR
      unlockTrezorAccount: nodeify(this.unlockTrezorAccount, this),

      // vault management
      submitPassword: nodeify(this.submitPassword, this),

      // network management
      setProviderType: nodeify(networkController.setProviderType, networkController),
      setCustomRpc: nodeify(this.setCustomRpc, this),

      // PreferencesController
      setSelectedAddress: nodeify(preferencesController.setSelectedAddress, preferencesController),
      addToken: nodeify(preferencesController.addToken, preferencesController),
      removeToken: nodeify(preferencesController.removeToken, preferencesController),
      setCurrentAccountTab: nodeify(preferencesController.setCurrentAccountTab, preferencesController),
      setAccountLabel: nodeify(preferencesController.setAccountLabel, preferencesController),
      setFeatureFlag: nodeify(preferencesController.setFeatureFlag, preferencesController),

      // AddressController
      setAddressBook: nodeify(addressBookController.setAddressBook, addressBookController),

      // KeyringController
      setLocked: nodeify(keyringController.setLocked, keyringController),
      createNewVaultAndKeychain: nodeify(this.createNewVaultAndKeychain, this),
      createNewVaultAndRestore: nodeify(this.createNewVaultAndRestore, this),
      addNewKeyring: nodeify(keyringController.addNewKeyring, keyringController),
      exportAccount: nodeify(keyringController.exportAccount, keyringController),

      // txController
      cancelTransaction: nodeify(txController.cancelTransaction, txController),
      updateTransaction: nodeify(txController.updateTransaction, txController),
      updateAndApproveTransaction: nodeify(txController.updateAndApproveTransaction, txController),
      retryTransaction: nodeify(this.retryTransaction, this),
      getFilteredTxList: nodeify(txController.getFilteredTxList, txController),
      isNonceTaken: nodeify(txController.isNonceTaken, txController),
      estimateGas: nodeify(this.estimateGas, this),

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


//=============================================================================
// VAULT / KEYRING RELATED METHODS
//=============================================================================

  /**
   * Creates a new Vault and create a new keychain.
   *
   * A vault, or KeyringController, is a controller that contains
   * many different account strategies, currently called Keyrings.
   * Creating it new means wiping all previous keyrings.
   *
   * A keychain, or keyring, controls many accounts with a single backup and signing strategy.
   * For example, a mnemonic phrase can generate many accounts, and is a keyring.
   *
   * @param  {string} password
   *
   * @returns {Object} vault
   */
  async createNewVaultAndKeychain (password) {
    const releaseLock = await this.createVaultMutex.acquire()
    try {
      let vault
      const accounts = await this.keyringController.getAccounts()
      if (accounts.length > 0) {
        vault = await this.keyringController.fullUpdate()
      } else {
        vault = await this.keyringController.createNewVaultAndKeychain(password)
        const accounts = await this.keyringController.getAccounts()
        this.preferencesController.setAddresses(accounts)
        this.selectFirstIdentity()
      }
      releaseLock()
      return vault
    } catch (err) {
      releaseLock()
      throw err
    }
  }

  /**
   * Create a new Vault and restore an existent keyring.
   * @param  {} password
   * @param  {} seed
   */
  async createNewVaultAndRestore (password, seed) {
    const releaseLock = await this.createVaultMutex.acquire()
    try {
      // clear known identities
      this.preferencesController.setAddresses([])
      // create new vault
      const vault = await this.keyringController.createNewVaultAndRestore(password, seed)
      // set new identities
      const accounts = await this.keyringController.getAccounts()
      this.preferencesController.setAddresses(accounts)
      this.selectFirstIdentity()
      releaseLock()
      return vault
    } catch (err) {
      releaseLock()
      throw err
    }
  }

  /*
   * Submits the user's password and attempts to unlock the vault.
   * Also synchronizes the preferencesController, to ensure its schema
   * is up to date with known accounts once the vault is decrypted.
   *
   * @param {string} password - The user's password
   * @returns {Promise<object>} - The keyringController update.
   */
  async submitPassword (password) {
    await this.keyringController.submitPassword(password)
    const accounts = await this.keyringController.getAccounts()

    // verify keyrings
    const nonSimpleKeyrings = this.keyringController.keyrings.filter(keyring => keyring.type !== 'Simple Key Pair')
    if (nonSimpleKeyrings.length > 1 && this.diagnostics) {
      await this.diagnostics.reportMultipleKeyrings(nonSimpleKeyrings)
    }

    await this.preferencesController.syncAddresses(accounts)
    return this.keyringController.fullUpdate()
  }

  /**
   * @type Identity
   * @property {string} name - The account nickname.
   * @property {string} address - The account's ethereum address, in lower case.
   * @property {boolean} mayBeFauceting - Whether this account is currently
   * receiving funds from our automatic Ropsten faucet.
   */

  /**
   * Sets the first address in the state to the selected address
   */
  selectFirstIdentity () {
    const { identities } = this.preferencesController.store.getState()
    const address = Object.keys(identities)[0]
    this.preferencesController.setSelectedAddress(address)
  }

  //
  // Hardware
  //

  /**
   * Fetch account list from a trezor device.
   *
   * @returns [] accounts
   */
  async connectHardware (deviceName, page) {

    switch (deviceName) {
      case 'trezor':
        const keyringController = this.keyringController
        const oldAccounts = await keyringController.getAccounts()
        let keyring = await keyringController.getKeyringsByType(
          'Trezor Hardware'
        )[0]
        if (!keyring) {
          keyring = await this.keyringController.addNewKeyring('Trezor Hardware')
        }
        let accounts = []

        switch (page) {
            case -1:
              accounts = await keyring.getPreviousPage()
              break
            case 1:
              accounts = await keyring.getNextPage()
              break
            default:
              accounts = await keyring.getFirstPage()
        }

        // Merge with existing accounts
        // and make sure addresses are not repeated
        const accountsToTrack = [...new Set(oldAccounts.concat(accounts.map(a => a.address.toLowerCase())))]
        this.accountTracker.syncWithAddresses(accountsToTrack)
        return accounts

      default:
        throw new Error('MetamaskController:connectHardware - Unknown device')
    }
  }

  /**
   * Check if the device is unlocked
   *
   * @returns {Promise<boolean>}
   */
  async checkHardwareStatus (deviceName) {

    switch (deviceName) {
      case 'trezor':
        const keyringController = this.keyringController
        const keyring = await keyringController.getKeyringsByType(
          'Trezor Hardware'
        )[0]
        if (!keyring) {
          return false
        }
        return keyring.isUnlocked()
      default:
        throw new Error('MetamaskController:checkHardwareStatus - Unknown device')
    }
  }

  /**
   * Clear
   *
   * @returns {Promise<boolean>}
   */
  async forgetDevice (deviceName) {

    switch (deviceName) {
      case 'trezor':
        const keyringController = this.keyringController
        const keyring = await keyringController.getKeyringsByType(
          'Trezor Hardware'
        )[0]
        if (!keyring) {
          throw new Error('MetamaskController:forgetDevice - Trezor Hardware keyring not found')
        }
        keyring.forgetDevice()
        return true
      default:
        throw new Error('MetamaskController:forgetDevice - Unknown device')
    }
  }

  /**
   * Imports an account from a trezor device.
   *
   * @returns {} keyState
   */
  async unlockTrezorAccount (index) {
    const keyringController = this.keyringController
    const keyring = await keyringController.getKeyringsByType(
      'Trezor Hardware'
    )[0]
    if (!keyring) {
      throw new Error('MetamaskController - No Trezor Hardware Keyring found')
    }

    keyring.setAccountToUnlock(index)
    const oldAccounts = await keyringController.getAccounts()
    const keyState = await keyringController.addNewAccount(keyring)
    const newAccounts = await keyringController.getAccounts()
    this.preferencesController.setAddresses(newAccounts)
    newAccounts.forEach(address => {
      if (!oldAccounts.includes(address)) {
        this.preferencesController.setAccountLabel(address, `TREZOR #${parseInt(index, 10) + 1}`)
        this.preferencesController.setSelectedAddress(address)
      }
    })

    const { identities } = this.preferencesController.store.getState()
    return { ...keyState, identities }
   }


  //
  // Account Management
  //

  /**
   * Adds a new account to the default (first) HD seed phrase Keyring.
   *
   * @returns {} keyState
   */
  async addNewAccount () {
    const primaryKeyring = this.keyringController.getKeyringsByType('HD Key Tree')[0]
    if (!primaryKeyring) {
      throw new Error('MetamaskController - No HD Key Tree found')
    }
    const keyringController = this.keyringController
    const oldAccounts = await keyringController.getAccounts()
    const keyState = await keyringController.addNewAccount(primaryKeyring)
    const newAccounts = await keyringController.getAccounts()

    await this.verifySeedPhrase()

    this.preferencesController.setAddresses(newAccounts)
    newAccounts.forEach((address) => {
      if (!oldAccounts.includes(address)) {
        this.preferencesController.setSelectedAddress(address)
      }
    })

    const {identities} = this.preferencesController.store.getState()
    return {...keyState, identities}
  }

  /**
   * Adds the current vault's seed words to the UI's state tree.
   *
   * Used when creating a first vault, to allow confirmation.
   * Also used when revealing the seed words in the confirmation view.
   *
   * @param {Function} cb - A callback called on completion.
   */
  placeSeedWords (cb) {

    this.verifySeedPhrase()
      .then((seedWords) => {
        this.configManager.setSeedWords(seedWords)
        return cb(null, seedWords)
      })
      .catch((err) => {
        return cb(err)
      })
  }

  /**
   * Verifies the validity of the current vault's seed phrase.
   *
   * Validity: seed phrase restores the accounts belonging to the current vault.
   *
   * Called when the first account is created and on unlocking the vault.
   *
   * @returns {Promise<string>} Seed phrase to be confirmed by the user.
   */
  async verifySeedPhrase () {

    const primaryKeyring = this.keyringController.getKeyringsByType('HD Key Tree')[0]
    if (!primaryKeyring) {
      throw new Error('MetamaskController - No HD Key Tree found')
    }

    const serialized = await primaryKeyring.serialize()
    const seedWords = serialized.mnemonic

    const accounts = await primaryKeyring.getAccounts()
    if (accounts.length < 1) {
      throw new Error('MetamaskController - No accounts found')
    }

    try {
      await seedPhraseVerifier.verifyAccounts(accounts, seedWords)
      return seedWords
    } catch (err) {
      log.error(err.message)
      throw err
    }
  }

  /**
   * Remove the primary account seed phrase from the UI's state tree.
   *
   * The seed phrase remains available in the background process.
   *
   * @param {function} cb Callback function called with the current address.
   */
  clearSeedWordCache (cb) {
    this.configManager.setSeedWords(null)
    cb(null, this.preferencesController.getSelectedAddress())
  }

  /**
   * Clears the transaction history, to allow users to force-reset their nonces.
   * Mostly used in development environments, when networks are restarted with
   * the same network ID.
   *
   * @returns Promise<string> The current selected address.
   */
  async resetAccount () {
    const selectedAddress = this.preferencesController.getSelectedAddress()
    this.txController.wipeTransactions(selectedAddress)
    this.networkController.resetConnection()

    return selectedAddress
  }

  /**
   * Removes an account from state / storage.
   *
   * @param {string[]} address A hex address
   *
   */
  async removeAccount (address) {
    // Remove account from the preferences controller
    this.preferencesController.removeAddress(address)
    // Remove account from the account tracker controller
    this.accountTracker.removeAccount(address)
    // Remove account from the keyring
    await this.keyringController.removeAccount(address)
    return address
  }


  /**
   * Imports an account with the specified import strategy.
   * These are defined in app/scripts/account-import-strategies
   * Each strategy represents a different way of serializing an Ethereum key pair.
   *
   * @param  {string} strategy - A unique identifier for an account import strategy.
   * @param  {any} args - The data required by that strategy to import an account.
   * @param  {Function} cb - A callback function called with a state update on success.
   */
  async importAccountWithStrategy (strategy, args) {
    const privateKey = await accountImporter.importAccount(strategy, args)
    const keyring = await this.keyringController.addNewKeyring('Simple Key Pair', [ privateKey ])
    const accounts = await keyring.getAccounts()
    // update accounts in preferences controller
    const allAccounts = await this.keyringController.getAccounts()
    this.preferencesController.setAddresses(allAccounts)
    // set new account as selected
    await this.preferencesController.setSelectedAddress(accounts[0])
  }

  // ---------------------------------------------------------------------------
  // Identity Management (signature operations)

  // eth_sign methods:

  /**
   * Called when a Dapp uses the eth_sign method, to request user approval.
   * eth_sign is a pure signature of arbitrary data. It is on a deprecation
   * path, since this data can be a transaction, or can leak private key
   * information.
   *
   * @param {Object} msgParams - The params passed to eth_sign.
   * @param {Function} cb = The callback function called with the signature.
   */
  newUnsignedMessage (msgParams, cb) {
    const msgId = this.messageManager.addUnapprovedMessage(msgParams)
    this.sendUpdate()
    this.opts.showUnconfirmedMessage()
    this.messageManager.once(`${msgId}:finished`, (data) => {
      switch (data.status) {
        case 'signed':
          return cb(null, data.rawSig)
        case 'rejected':
          return cb(cleanErrorStack(new Error('MetaMask Message Signature: User denied message signature.')))
        default:
          return cb(cleanErrorStack(new Error(`MetaMask Message Signature: Unknown problem: ${JSON.stringify(msgParams)}`)))
      }
    })
  }

  /**
   * Signifies user intent to complete an eth_sign method.
   *
   * @param  {Object} msgParams The params passed to eth_call.
   * @returns {Promise<Object>} Full state update.
   */
  signMessage (msgParams) {
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

  /**
   * Used to cancel a message submitted via eth_sign.
   *
   * @param {string} msgId - The id of the message to cancel.
   */
  cancelMessage (msgId, cb) {
    const messageManager = this.messageManager
    messageManager.rejectMsg(msgId)
    if (cb && typeof cb === 'function') {
      cb(null, this.getState())
    }
  }

  // personal_sign methods:

  /**
   * Called when a dapp uses the personal_sign method.
   * This is identical to the Geth eth_sign method, and may eventually replace
   * eth_sign.
   *
   * We currently define our eth_sign and personal_sign mostly for legacy Dapps.
   *
   * @param {Object} msgParams - The params of the message to sign & return to the Dapp.
   * @param {Function} cb - The callback function called with the signature.
   * Passed back to the requesting Dapp.
   */
  newUnsignedPersonalMessage (msgParams, cb) {
    if (!msgParams.from) {
      return cb(cleanErrorStack(new Error('MetaMask Message Signature: from field is required.')))
    }

    const msgId = this.personalMessageManager.addUnapprovedMessage(msgParams)
    this.sendUpdate()
    this.opts.showUnconfirmedMessage()
    this.personalMessageManager.once(`${msgId}:finished`, (data) => {
      switch (data.status) {
        case 'signed':
          return cb(null, data.rawSig)
        case 'rejected':
          return cb(cleanErrorStack(new Error('MetaMask Message Signature: User denied message signature.')))
        default:
          return cb(cleanErrorStack(new Error(`MetaMask Message Signature: Unknown problem: ${JSON.stringify(msgParams)}`)))
      }
    })
  }

  /**
   * Signifies a user's approval to sign a personal_sign message in queue.
   * Triggers signing, and the callback function from newUnsignedPersonalMessage.
   *
   * @param {Object} msgParams - The params of the message to sign & return to the Dapp.
   * @returns {Promise<Object>} - A full state update.
   */
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

  /**
   * Used to cancel a personal_sign type message.
   * @param {string} msgId - The ID of the message to cancel.
   * @param {Function} cb - The callback function called with a full state update.
   */
  cancelPersonalMessage (msgId, cb) {
    const messageManager = this.personalMessageManager
    messageManager.rejectMsg(msgId)
    if (cb && typeof cb === 'function') {
      cb(null, this.getState())
    }
  }

  // eth_signTypedData methods

  /**
   * Called when a dapp uses the eth_signTypedData method, per EIP 712.
   *
   * @param {Object} msgParams - The params passed to eth_signTypedData.
   * @param {Function} cb - The callback function, called with the signature.
   */
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
          return cb(cleanErrorStack(new Error('MetaMask Message Signature: User denied message signature.')))
        default:
          return cb(cleanErrorStack(new Error(`MetaMask Message Signature: Unknown problem: ${JSON.stringify(msgParams)}`)))
      }
    })
  }

  /**
   * The method for a user approving a call to eth_signTypedData, per EIP 712.
   * Triggers the callback in newUnsignedTypedMessage.
   *
   * @param  {Object} msgParams - The params passed to eth_signTypedData.
   * @returns {Object} Full state update.
   */
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

  /**
   * Used to cancel a eth_signTypedData type message.
   * @param {string} msgId - The ID of the message to cancel.
   * @param {Function} cb - The callback function called with a full state update.
   */
  cancelTypedMessage (msgId, cb) {
    const messageManager = this.typedMessageManager
    messageManager.rejectMsg(msgId)
    if (cb && typeof cb === 'function') {
      cb(null, this.getState())
    }
  }

  // ---------------------------------------------------------------------------
  // MetaMask Version 3 Migration Account Restauration Methods

  /**
   * A legacy method (probably dead code) that was used when we swapped out our
   * key management library that we depended on.
   *
   * Described in:
   * https://medium.com/metamask/metamask-3-migration-guide-914b79533cdd
   *
   * @deprecated
   * @param  {} migratorOutput
   */
  restoreOldVaultAccounts (migratorOutput) {
    const { serialized } = migratorOutput
    return this.keyringController.restoreKeyring(serialized)
    .then(() => migratorOutput)
  }

  /**
   * A legacy method used to record user confirmation that they understand
   * that some of their accounts have been recovered but should be backed up.
   *
   * @deprecated
   * @param {Function} cb - A callback function called with a full state update.
   */
  markAccountsFound (cb) {
    this.configManager.setLostAccounts([])
    this.sendUpdate()
    cb(null, this.getState())
  }

  /**
   * A legacy method (probably dead code) that was used when we swapped out our
   * key management library that we depended on.
   *
   * Described in:
   * https://medium.com/metamask/metamask-3-migration-guide-914b79533cdd
   *
   * @deprecated
   * @param  {} migratorOutput
   */
  restoreOldLostAccounts (migratorOutput) {
    const { lostAccounts } = migratorOutput
    if (lostAccounts) {
      this.configManager.setLostAccounts(lostAccounts.map(acct => acct.address))
      return this.importLostAccounts(migratorOutput)
    }
    return Promise.resolve(migratorOutput)
  }

  /**
   * An account object
   * @typedef Account
   * @property string privateKey - The private key of the account.
   */

  /**
   * Probably no longer needed, related to the Version 3 migration.
   * Imports a hash of accounts to private keys into the vault.
   *
   * Described in:
   * https://medium.com/metamask/metamask-3-migration-guide-914b79533cdd
   *
   * Uses the array's private keys to create a new Simple Key Pair keychain
   * and add it to the keyring controller.
   * @deprecated
   * @param  {Account[]} lostAccounts -
   * @returns {Keyring[]} An array of the restored keyrings.
   */
  importLostAccounts ({ lostAccounts }) {
    const privKeys = lostAccounts.map(acct => acct.privateKey)
    return this.keyringController.restoreKeyring({
      type: 'Simple Key Pair',
      data: privKeys,
    })
  }

//=============================================================================
// END (VAULT / KEYRING RELATED METHODS)
//=============================================================================

  /**
   * Allows a user to try to speed up a transaction by retrying it
   * with higher gas.
   *
   * @param {string} txId - The ID of the transaction to speed up.
   * @param {Function} cb - The callback function called with a full state update.
   */
  async retryTransaction (txId, cb) {
    await this.txController.retryTransaction(txId)
    const state = await this.getState()
    return state
  }

  estimateGas (estimateGasParams) {
    return new Promise((resolve, reject) => {
      return this.txController.txGasUtil.query.estimateGas(estimateGasParams, (err, res) => {
        if (err) {
          return reject(err)
        }

        return resolve(res)
      })
    })
  }

//=============================================================================
// PASSWORD MANAGEMENT
//=============================================================================

  /**
   * Allows a user to begin the seed phrase recovery process.
   * @param {Function} cb - A callback function called when complete.
   */
  markPasswordForgotten (cb) {
    this.configManager.setPasswordForgotten(true)
    this.sendUpdate()
    cb()
  }

  /**
   * Allows a user to end the seed phrase recovery process.
   * @param {Function} cb - A callback function called when complete.
   */
  unMarkPasswordForgotten (cb) {
    this.configManager.setPasswordForgotten(false)
    this.sendUpdate()
    cb()
  }

//=============================================================================
// SETUP
//=============================================================================

  /**
   * Used to create a multiplexed stream for connecting to an untrusted context
   * like a Dapp or other extension.
   * @param {*} connectionStream - The Duplex stream to connect to.
   * @param {string} originDomain - The domain requesting the stream, which
   * may trigger a blacklist reload.
   */
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

  /**
   * Used to create a multiplexed stream for connecting to a trusted context,
   * like our own user interfaces, which have the provider APIs, but also
   * receive the exported API from this controller, which includes trusted
   * functions, like the ability to approve transactions or sign messages.
   *
   * @param {*} connectionStream - The duplex stream to connect to.
   * @param {string} originDomain - The domain requesting the connection,
   * used in logging and error reporting.
   */
  setupTrustedCommunication (connectionStream, originDomain) {
    // setup multiplexing
    const mux = setupMultiplex(connectionStream)
    // connect features
    this.setupControllerConnection(mux.createStream('controller'))
    this.setupProviderConnection(mux.createStream('provider'), originDomain)
  }

  /**
   * Called when we detect a suspicious domain. Requests the browser redirects
   * to our anti-phishing page.
   *
   * @private
   * @param {*} connectionStream - The duplex stream to the per-page script,
   * for sending the reload attempt to.
   * @param {string} hostname - The URL that triggered the suspicion.
   */
  sendPhishingWarning (connectionStream, hostname) {
    const mux = setupMultiplex(connectionStream)
    const phishingStream = mux.createStream('phishing')
    phishingStream.write({ hostname })
  }

  /**
   * A method for providing our API over a stream using Dnode.
   * @param {*} outStream - The stream to provide our API over.
   */
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

  /**
   * A method for serving our ethereum provider over a given stream.
   * @param {*} outStream - The stream to provide over.
   * @param {string} origin - The URI of the requesting resource.
   */
  setupProviderConnection (outStream, origin) {
    // setup json rpc engine stack
    const engine = new RpcEngine()

    // create filter polyfill middleware
    const filterMiddleware = createFilterMiddleware({
      provider: this.provider,
      blockTracker: this.provider._blockTracker,
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

  /**
   * A method for providing our public config info over a stream.
   * This includes info we like to be synchronous if possible, like
   * the current selected account, and network ID.
   *
   * Since synchronous methods have been deprecated in web3,
   * this is a good candidate for deprecation.
   *
   * @param {*} outStream - The stream to provide public config over.
   */
  setupPublicConfig (outStream) {
    pump(
      asStream(this.publicConfigStore),
      outStream,
      (err) => {
        if (err) log.error(err)
      }
    )
  }

  /**
   * A method for emitting the full MetaMask state to all registered listeners.
   * @private
   */
  privateSendUpdate () {
    this.emit('update', this.getState())
  }

  /**
   * A method for estimating a good gas price at recent prices.
   * Returns the lowest price that would have been included in
   * 50% of recent blocks.
   *
   * @returns {string} A hex representation of the suggested wei gas price.
   */
  getGasPrice () {
    const { recentBlocksController } = this
    const { recentBlocks } = recentBlocksController.store.getState()

    // Return 1 gwei if no blocks have been observed:
    if (recentBlocks.length === 0) {
      return '0x' + GWEI_BN.toString(16)
    }

    const lowestPrices = recentBlocks.map((block) => {
      if (!block.gasPrices || block.gasPrices.length < 1) {
        return GWEI_BN
      }
      return block.gasPrices
      .map(hexPrefix => hexPrefix.substr(2))
      .map(hex => new BN(hex, 16))
      .sort((a, b) => {
        return a.gt(b) ? 1 : -1
      })[0]
    })
    .map(number => number.div(GWEI_BN).toNumber())

    const percentileNum = percentile(50, lowestPrices)
    const percentileNumBn = new BN(percentileNum)
    return '0x' + percentileNumBn.mul(GWEI_BN).toString(16)
  }

//=============================================================================
// CONFIG
//=============================================================================

  // Log blocks

  /**
   * A method for setting the user's preferred display currency.
   * @param {string} currencyCode - The code of the preferred currency.
   * @param {Function} cb - A callback function returning currency info.
   */
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

  /**
   * A method for forwarding the user to the easiest way to obtain ether,
   * or the network "gas" currency, for the current selected network.
   *
   * @param {string} address - The address to fund.
   * @param {string} amount - The amount of ether desired, as a base 10 string.
   */
  buyEth (address, amount) {
    if (!amount) amount = '5'
    const network = this.networkController.getNetworkState()
    const url = getBuyEthUrl({ network, address, amount })
    if (url) this.platform.openWindow({ url })
  }

  /**
   * A method for triggering a shapeshift currency transfer.
   * @param {string} depositAddress - The address to deposit to.
   * @property {string} depositType - An abbreviation of the type of crypto currency to be deposited.
   */
  createShapeShiftTx (depositAddress, depositType) {
    this.shapeshiftController.createShapeShiftTx(depositAddress, depositType)
  }

  // network

  /**
   * A method for selecting a custom URL for an ethereum RPC provider.
   * @param {string} rpcTarget - A URL for a valid Ethereum RPC API.
   * @returns {Promise<String>} - The RPC Target URL confirmed.
   */
  async setCustomRpc (rpcTarget) {
    this.networkController.setRpcTarget(rpcTarget)
    await this.preferencesController.updateFrequentRpcList(rpcTarget)
    return rpcTarget
  }

  /**
   * Sets whether or not to use the blockie identicon format.
   * @param {boolean} val - True for bockie, false for jazzicon.
   * @param {Function} cb - A callback function called when complete.
   */
  setUseBlockie (val, cb) {
    try {
      this.preferencesController.setUseBlockie(val)
      cb(null)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * A method for setting a user's current locale, affecting the language rendered.
   * @param {string} key - Locale identifier.
   * @param {Function} cb - A callback function called when complete.
   */
  setCurrentLocale (key, cb) {
    try {
      this.preferencesController.setCurrentLocale(key)
      cb(null)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * A method for initializing storage the first time.
   * @param {Object} initState - The default state to initialize with.
   * @private
   */
  recordFirstTimeInfo (initState) {
    if (!('firstTimeInfo' in initState)) {
      initState.firstTimeInfo = {
        version,
        date: Date.now(),
      }
    }
  }

  /**
   * A method for recording whether the MetaMask user interface is open or not.
   * @private
   * @param {boolean} open
   */
  set isClientOpen (open) {
    this._isClientOpen = open
    this.isClientOpenAndUnlocked = this.getState().isUnlocked && open
    this.detectTokensController.isOpen = open
  }

  /**
   * A method for activating the retrieval of price data,
   * which should only be fetched when the UI is visible.
   * @private
   * @param {boolean} active - True if price data should be getting fetched.
   */
  set isClientOpenAndUnlocked (active) {
    this.tokenRatesController.isActive = active
  }
}
