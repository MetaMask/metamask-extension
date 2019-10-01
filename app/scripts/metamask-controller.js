/**
 * @file      The central metamask controller. Aggregates other controllers and exports an api.
 * @copyright Copyright (c) 2018 MetaMask
 * @license   MIT
 */

const EventEmitter = require('events')
const pump = require('pump')
const Dnode = require('dnode')
const pify = require('pify')
const ObservableStore = require('obs-store')
const ComposableObservableStore = require('./lib/ComposableObservableStore')
const createDnodeRemoteGetter = require('./lib/createDnodeRemoteGetter')
const asStream = require('obs-store/lib/asStream')
const AccountTracker = require('./lib/account-tracker')
const RpcEngine = require('json-rpc-engine')
const debounce = require('debounce')
const createEngineStream = require('json-rpc-middleware-stream/engineStream')
const createFilterMiddleware = require('eth-json-rpc-filters')
const createSubscriptionManager = require('eth-json-rpc-filters/subscriptionManager')
const createOriginMiddleware = require('./lib/createOriginMiddleware')
const createLoggerMiddleware = require('./lib/createLoggerMiddleware')
const providerAsMiddleware = require('eth-json-rpc-middleware/providerAsMiddleware')
const {setupMultiplex} = require('./lib/stream-utils.js')
const KeyringController = require('eth-keyring-controller')
const NetworkController = require('./controllers/network')
const PreferencesController = require('./controllers/preferences')
const AppStateController = require('./controllers/app-state')
const InfuraController = require('./controllers/infura')
const CachedBalancesController = require('./controllers/cached-balances')
const OnboardingController = require('./controllers/onboarding')
const ThreeBoxController = require('./controllers/threebox')
const RecentBlocksController = require('./controllers/recent-blocks')
const IncomingTransactionsController = require('./controllers/incoming-transactions')
const MessageManager = require('./lib/message-manager')
const PersonalMessageManager = require('./lib/personal-message-manager')
const TypedMessageManager = require('./lib/typed-message-manager')
const TransactionController = require('./controllers/transactions')
const TokenRatesController = require('./controllers/token-rates')
const DetectTokensController = require('./controllers/detect-tokens')
const ProviderApprovalController = require('./controllers/provider-approval')
const ABTestController = require('./controllers/ab-test')
const nodeify = require('./lib/nodeify')
const accountImporter = require('./account-import-strategies')
const getBuyEthUrl = require('./lib/buy-eth-url')
const selectChainId = require('./lib/select-chain-id')
const {Mutex} = require('await-semaphore')
const {version} = require('../manifest.json')
const {BN} = require('ethereumjs-util')
const GWEI_BN = new BN('1000000000')
const percentile = require('percentile')
const seedPhraseVerifier = require('./lib/seed-phrase-verifier')
const log = require('loglevel')
const TrezorKeyring = require('eth-trezor-keyring')
const LedgerBridgeKeyring = require('eth-ledger-bridge-keyring')
const HW_WALLETS_KEYRINGS = [TrezorKeyring.type, LedgerBridgeKeyring.type]
const EthQuery = require('eth-query')
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const contractMap = require('eth-contract-metadata')
const {
  AddressBookController,
  CurrencyRateController,
  ShapeShiftController,
  PhishingController,
} = require('gaba')
const backEndMetaMetricsEvent = require('./lib/backend-metametrics')

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

    // this keeps track of how many "controllerStream" connections are open
    // the only thing that uses controller connections are open metamask UI instances
    this.activeControllerConnections = 0

    // platform-specific api
    this.platform = opts.platform

    // observable state store
    this.store = new ComposableObservableStore(initState)

    // lock to ensure only one vault created at once
    this.createVaultMutex = new Mutex()

    // network store
    this.networkController = new NetworkController(initState.NetworkController)

    // preferences controller
    this.preferencesController = new PreferencesController({
      initState: initState.PreferencesController,
      initLangCode: opts.initLangCode,
      openPopup: opts.openPopup,
      network: this.networkController,
    })

    // app-state controller
    this.appStateController = new AppStateController({
      preferencesStore: this.preferencesController.store,
      onInactiveTimeout: () => this.setLocked(),
    })

    // currency controller
    this.currencyRateController = new CurrencyRateController(undefined, initState.CurrencyController)

    // infura controller
    this.infuraController = new InfuraController({
      initState: initState.InfuraController,
    })
    this.infuraController.scheduleInfuraNetworkCheck()

    this.phishingController = new PhishingController()

    // rpc provider
    this.initializeProvider()
    this.provider = this.networkController.getProviderAndBlockTracker().provider
    this.blockTracker = this.networkController.getProviderAndBlockTracker().blockTracker

    // token exchange rate tracker
    this.tokenRatesController = new TokenRatesController({
      currency: this.currencyRateController,
      preferences: this.preferencesController.store,
    })

    this.recentBlocksController = new RecentBlocksController({
      blockTracker: this.blockTracker,
      provider: this.provider,
      networkController: this.networkController,
    })

    this.incomingTransactionsController = new IncomingTransactionsController({
      blockTracker: this.blockTracker,
      networkController: this.networkController,
      preferencesController: this.preferencesController,
      initState: initState.IncomingTransactionsController,
    })

    // account tracker watches balances, nonces, and any code at their address.
    this.accountTracker = new AccountTracker({
      provider: this.provider,
      blockTracker: this.blockTracker,
      network: this.networkController,
    })

    // start and stop polling for balances based on activeControllerConnections
    this.on('controllerConnectionChanged', (activeControllerConnections) => {
      if (activeControllerConnections > 0) {
        this.accountTracker.start()
        this.incomingTransactionsController.start()
      } else {
        this.accountTracker.stop()
        this.incomingTransactionsController.stop()
      }
    })

    this.cachedBalancesController = new CachedBalancesController({
      accountTracker: this.accountTracker,
      getNetwork: this.networkController.getNetworkState.bind(this.networkController),
      initState: initState.CachedBalancesController,
    })

    this.onboardingController = new OnboardingController({
      initState: initState.OnboardingController,
    })

    // ensure accountTracker updates balances after network change
    this.networkController.on('networkDidChange', () => {
      this.accountTracker._updateAccounts()
    })

    // key mgmt
    const additionalKeyrings = [TrezorKeyring, LedgerBridgeKeyring]
    this.keyringController = new KeyringController({
      keyringTypes: additionalKeyrings,
      initState: initState.KeyringController,
      getNetwork: this.networkController.getNetworkState.bind(this.networkController),
      encryptor: opts.encryptor || undefined,
    })

    this.keyringController.memStore.subscribe((s) => this._onKeyringControllerUpdate(s))

    // detect tokens controller
    this.detectTokensController = new DetectTokensController({
      preferences: this.preferencesController,
      network: this.networkController,
      keyringMemStore: this.keyringController.memStore,
    })

    this.addressBookController = new AddressBookController(undefined, initState.AddressBookController)

    this.threeBoxController = new ThreeBoxController({
      preferencesController: this.preferencesController,
      addressBookController: this.addressBookController,
      keyringController: this.keyringController,
      initState: initState.ThreeBoxController,
      getKeyringControllerState: this.keyringController.memStore.getState.bind(this.keyringController.memStore),
      version,
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
    this.txController.on('newUnapprovedTx', () => opts.showUnapprovedTx())

    this.txController.on(`tx:status-update`, async (txId, status) => {
      if (status === 'confirmed' || status === 'failed') {
        const txMeta = this.txController.txStateManager.getTx(txId)
        this.platform.showTransactionNotification(txMeta)

        const { txReceipt } = txMeta
        const participateInMetaMetrics = this.preferencesController.getParticipateInMetaMetrics()
        if (txReceipt && txReceipt.status === '0x0' && participateInMetaMetrics) {
          const metamaskState = await this.getState()
          backEndMetaMetricsEvent(metamaskState, {
            customVariables: {
              errorMessage: txMeta.simulationFails.reason,
            },
            eventOpts: {
              category: 'backend',
              action: 'Transactions',
              name: 'On Chain Failure',
            },
          })
        }
      }
    })

    this.networkController.on('networkDidChange', () => {
      this.setCurrentCurrency(this.currencyRateController.state.currentCurrency, function () {})
    })

    this.shapeshiftController = new ShapeShiftController(undefined, initState.ShapeShiftController)

    this.networkController.lookupNetwork()
    this.messageManager = new MessageManager()
    this.personalMessageManager = new PersonalMessageManager()
    this.typedMessageManager = new TypedMessageManager({ networkController: this.networkController })

    // ensure isClientOpenAndUnlocked is updated when memState updates
    this.on('update', (memState) => {
      this.isClientOpenAndUnlocked = memState.isUnlocked && this._isClientOpen
    })

    this.providerApprovalController = new ProviderApprovalController({
      closePopup: opts.closePopup,
      initState: initState.ProviderApprovalController,
      keyringController: this.keyringController,
      openPopup: opts.openPopup,
      preferencesController: this.preferencesController,
    })

    this.abTestController = new ABTestController({
      initState: initState.ABTestController,
    })

    this.store.updateStructure({
      AppStateController: this.appStateController.store,
      TransactionController: this.txController.store,
      KeyringController: this.keyringController.store,
      PreferencesController: this.preferencesController.store,
      AddressBookController: this.addressBookController,
      CurrencyController: this.currencyRateController,
      ShapeShiftController: this.shapeshiftController,
      NetworkController: this.networkController.store,
      InfuraController: this.infuraController.store,
      CachedBalancesController: this.cachedBalancesController.store,
      OnboardingController: this.onboardingController.store,
      ProviderApprovalController: this.providerApprovalController.store,
      IncomingTransactionsController: this.incomingTransactionsController.store,
      ThreeBoxController: this.threeBoxController.store,
      ABTestController: this.abTestController.store,
    })

    this.memStore = new ComposableObservableStore(null, {
      AppStateController: this.appStateController.store,
      NetworkController: this.networkController.store,
      AccountTracker: this.accountTracker.store,
      TxController: this.txController.memStore,
      CachedBalancesController: this.cachedBalancesController.store,
      TokenRatesController: this.tokenRatesController.store,
      MessageManager: this.messageManager.memStore,
      PersonalMessageManager: this.personalMessageManager.memStore,
      TypesMessageManager: this.typedMessageManager.memStore,
      KeyringController: this.keyringController.memStore,
      PreferencesController: this.preferencesController.store,
      RecentBlocksController: this.recentBlocksController.store,
      AddressBookController: this.addressBookController,
      CurrencyController: this.currencyRateController,
      ShapeshiftController: this.shapeshiftController,
      InfuraController: this.infuraController.store,
      OnboardingController: this.onboardingController.store,
      // ProviderApprovalController
      ProviderApprovalController: this.providerApprovalController.store,
      ProviderApprovalControllerMemStore: this.providerApprovalController.memStore,
      IncomingTransactionsController: this.incomingTransactionsController.store,
      // ThreeBoxController
      ThreeBoxController: this.threeBoxController.store,
      ABTestController: this.abTestController.store,
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
      },
      version,
      // account mgmt
      getAccounts: async ({ origin }) => {
        // Expose no accounts if this origin has not been approved, preventing
        // account-requring RPC methods from completing successfully
        const exposeAccounts = this.providerApprovalController.shouldExposeAccounts(origin)
        if (origin !== 'MetaMask' && !exposeAccounts) { return [] }
        const isUnlocked = this.keyringController.memStore.getState().isUnlocked
        const selectedAddress = this.preferencesController.getSelectedAddress()
        // only show address if account is unlocked
        if (isUnlocked && selectedAddress) {
          return [selectedAddress]
        } else {
          return []
        }
      },
      // tx signing
      processTransaction: this.newUnapprovedTransaction.bind(this),
      // msg signing
      processEthSignMessage: this.newUnsignedMessage.bind(this),
      processTypedMessage: this.newUnsignedTypedMessage.bind(this),
      processTypedMessageV3: this.newUnsignedTypedMessage.bind(this),
      processTypedMessageV4: this.newUnsignedTypedMessage.bind(this),
      processPersonalMessage: this.newUnsignedPersonalMessage.bind(this),
      getPendingNonce: this.getPendingNonce.bind(this),
    }
    const providerProxy = this.networkController.initializeProvider(providerOpts)
    return providerProxy
  }

  /**
   * Constructor helper: initialize a public config store.
   * This store is used to make some config info available to Dapps synchronously.
   */
  createPublicConfigStore ({ checkIsEnabled }) {
    // subset of state for metamask inpage provider
    const publicConfigStore = new ObservableStore()

    // setup memStore subscription hooks
    this.on('update', updatePublicConfigStore)
    updatePublicConfigStore(this.getState())

    publicConfigStore.destroy = () => {
      this.removeEventListener && this.removeEventListener('update', updatePublicConfigStore)
    }

    function updatePublicConfigStore (memState) {
      const publicState = selectPublicState(memState)
      publicConfigStore.putState(publicState)
    }

    function selectPublicState ({ isUnlocked, selectedAddress, network, completedOnboarding, provider }) {
      const isEnabled = checkIsEnabled()
      const isReady = isUnlocked && isEnabled
      const result = {
        isUnlocked,
        isEnabled,
        selectedAddress: isReady ? selectedAddress : null,
        networkVersion: network,
        onboardingcomplete: completedOnboarding,
        chainId: selectChainId({ network, provider }),
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
    const vault = this.keyringController.store.getState().vault
    const isInitialized = !!vault

    return {
      ...{ isInitialized },
      ...this.memStore.getFlatState(),
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
    const networkController = this.networkController
    const providerApprovalController = this.providerApprovalController
    const onboardingController = this.onboardingController
    const threeBoxController = this.threeBoxController
    const abTestController = this.abTestController

    return {
      // etc
      getState: (cb) => cb(null, this.getState()),
      setCurrentCurrency: this.setCurrentCurrency.bind(this),
      setUseBlockie: this.setUseBlockie.bind(this),
      setUseNonceField: this.setUseNonceField.bind(this),
      setParticipateInMetaMetrics: this.setParticipateInMetaMetrics.bind(this),
      setMetaMetricsSendCount: this.setMetaMetricsSendCount.bind(this),
      setFirstTimeFlowType: this.setFirstTimeFlowType.bind(this),
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
      verifySeedPhrase: nodeify(this.verifySeedPhrase, this),
      resetAccount: nodeify(this.resetAccount, this),
      removeAccount: nodeify(this.removeAccount, this),
      importAccountWithStrategy: nodeify(this.importAccountWithStrategy, this),

      // hardware wallets
      connectHardware: nodeify(this.connectHardware, this),
      forgetDevice: nodeify(this.forgetDevice, this),
      checkHardwareStatus: nodeify(this.checkHardwareStatus, this),
      unlockHardwareWalletAccount: nodeify(this.unlockHardwareWalletAccount, this),

      // mobile
      fetchInfoToSync: nodeify(this.fetchInfoToSync, this),

      // vault management
      submitPassword: nodeify(this.submitPassword, this),

      // network management
      setProviderType: nodeify(networkController.setProviderType, networkController),
      setCustomRpc: nodeify(this.setCustomRpc, this),
      updateAndSetCustomRpc: nodeify(this.updateAndSetCustomRpc, this),
      delCustomRpc: nodeify(this.delCustomRpc, this),

      // PreferencesController
      setSelectedAddress: nodeify(preferencesController.setSelectedAddress, preferencesController),
      addToken: nodeify(preferencesController.addToken, preferencesController),
      removeToken: nodeify(preferencesController.removeToken, preferencesController),
      removeSuggestedTokens: nodeify(preferencesController.removeSuggestedTokens, preferencesController),
      setCurrentAccountTab: nodeify(preferencesController.setCurrentAccountTab, preferencesController),
      setAccountLabel: nodeify(preferencesController.setAccountLabel, preferencesController),
      setFeatureFlag: nodeify(preferencesController.setFeatureFlag, preferencesController),
      setPreference: nodeify(preferencesController.setPreference, preferencesController),
      completeOnboarding: nodeify(preferencesController.completeOnboarding, preferencesController),
      addKnownMethodData: nodeify(preferencesController.addKnownMethodData, preferencesController),
      unsetMigratedPrivacyMode: nodeify(preferencesController.unsetMigratedPrivacyMode, preferencesController),

      // BlacklistController
      whitelistPhishingDomain: this.whitelistPhishingDomain.bind(this),

      // AddressController
      setAddressBook: nodeify(this.addressBookController.set, this.addressBookController),
      removeFromAddressBook: this.addressBookController.delete.bind(this.addressBookController),

      // AppStateController
      setLastActiveTime: nodeify(this.appStateController.setLastActiveTime, this.appStateController),

      // KeyringController
      setLocked: nodeify(this.setLocked, this),
      createNewVaultAndKeychain: nodeify(this.createNewVaultAndKeychain, this),
      createNewVaultAndRestore: nodeify(this.createNewVaultAndRestore, this),
      addNewKeyring: nodeify(keyringController.addNewKeyring, keyringController),
      exportAccount: nodeify(keyringController.exportAccount, keyringController),

      // txController
      cancelTransaction: nodeify(txController.cancelTransaction, txController),
      updateTransaction: nodeify(txController.updateTransaction, txController),
      updateAndApproveTransaction: nodeify(txController.updateAndApproveTransaction, txController),
      retryTransaction: nodeify(this.retryTransaction, this),
      createCancelTransaction: nodeify(this.createCancelTransaction, this),
      createSpeedUpTransaction: nodeify(this.createSpeedUpTransaction, this),
      getFilteredTxList: nodeify(txController.getFilteredTxList, txController),
      isNonceTaken: nodeify(txController.isNonceTaken, txController),
      estimateGas: nodeify(this.estimateGas, this),
      getPendingNonce: nodeify(this.getPendingNonce, this),

      // messageManager
      signMessage: nodeify(this.signMessage, this),
      cancelMessage: this.cancelMessage.bind(this),

      // personalMessageManager
      signPersonalMessage: nodeify(this.signPersonalMessage, this),
      cancelPersonalMessage: this.cancelPersonalMessage.bind(this),

      // personalMessageManager
      signTypedMessage: nodeify(this.signTypedMessage, this),
      cancelTypedMessage: this.cancelTypedMessage.bind(this),

      // provider approval
      approveProviderRequestByOrigin: providerApprovalController.approveProviderRequestByOrigin.bind(providerApprovalController),
      rejectProviderRequestByOrigin: providerApprovalController.rejectProviderRequestByOrigin.bind(providerApprovalController),
      clearApprovedOrigins: providerApprovalController.clearApprovedOrigins.bind(providerApprovalController),

      // onboarding controller
      setSeedPhraseBackedUp: nodeify(onboardingController.setSeedPhraseBackedUp, onboardingController),

      // 3Box
      setThreeBoxSyncingPermission: nodeify(threeBoxController.setThreeBoxSyncingPermission, threeBoxController),
      restoreFromThreeBox: nodeify(threeBoxController.restoreFromThreeBox, threeBoxController),
      setShowRestorePromptToFalse: nodeify(threeBoxController.setShowRestorePromptToFalse, threeBoxController),
      getThreeBoxLastUpdated: nodeify(threeBoxController.getLastUpdated, threeBoxController),
      turnThreeBoxSyncingOn: nodeify(threeBoxController.turnThreeBoxSyncingOn, threeBoxController),
      initializeThreeBox: nodeify(this.initializeThreeBox, this),

      // a/b test controller
      getAssignedABTestGroupName: nodeify(abTestController.getAssignedABTestGroupName, abTestController),
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
      let accounts, lastBalance

      const keyringController = this.keyringController

      // clear known identities
      this.preferencesController.setAddresses([])
      // create new vault
      const vault = await keyringController.createNewVaultAndRestore(password, seed)

      const ethQuery = new EthQuery(this.provider)
      accounts = await keyringController.getAccounts()
      lastBalance = await this.getBalance(accounts[accounts.length - 1], ethQuery)

      const primaryKeyring = keyringController.getKeyringsByType('HD Key Tree')[0]
      if (!primaryKeyring) {
        throw new Error('MetamaskController - No HD Key Tree found')
      }

      // seek out the first zero balance
      while (lastBalance !== '0x0') {
        await keyringController.addNewAccount(primaryKeyring)
        accounts = await keyringController.getAccounts()
        lastBalance = await this.getBalance(accounts[accounts.length - 1], ethQuery)
      }

      // set new identities
      this.preferencesController.setAddresses(accounts)
      this.selectFirstIdentity()
      releaseLock()
      return vault
    } catch (err) {
      releaseLock()
      throw err
    }
  }

  /**
   * Get an account balance from the AccountTracker or request it directly from the network.
   * @param {string} address - The account address
   * @param {EthQuery} ethQuery - The EthQuery instance to use when asking the network
   */
  getBalance (address, ethQuery) {
    return new Promise((resolve, reject) => {
      const cached = this.accountTracker.store.getState().accounts[address]

      if (cached && cached.balance) {
        resolve(cached.balance)
      } else {
        ethQuery.getBalance(address, (error, balance) => {
          if (error) {
            reject(error)
            log.error(error)
          } else {
            resolve(balance || '0x0')
          }
        })
      }
    })
  }

  /**
   * Collects all the information that we want to share
   * with the mobile client for syncing purposes
   * @returns Promise<Object> Parts of the state that we want to syncx
   */
  async fetchInfoToSync () {
    // Preferences
    const {
      accountTokens,
      currentLocale,
      frequentRpcList,
      identities,
      selectedAddress,
      tokens,
    } = this.preferencesController.store.getState()

    // Filter ERC20 tokens
    const filteredAccountTokens = {}
    Object.keys(accountTokens).forEach(address => {
      const checksummedAddress = ethUtil.toChecksumAddress(address)
      filteredAccountTokens[checksummedAddress] = {}
      Object.keys(accountTokens[address]).forEach(
        networkType => (filteredAccountTokens[checksummedAddress][networkType] = networkType !== 'mainnet' ?
          accountTokens[address][networkType] :
          accountTokens[address][networkType].filter(({ address }) => {
            const tokenAddress = ethUtil.toChecksumAddress(address)
            return contractMap[tokenAddress] ? contractMap[tokenAddress].erc20 : true
          })
        )
      )
    })

    const preferences = {
      accountTokens: filteredAccountTokens,
      currentLocale,
      frequentRpcList,
      identities,
      selectedAddress,
      tokens,
    }

    // Accounts
    const hdKeyring = this.keyringController.getKeyringsByType('HD Key Tree')[0]
    const hdAccounts = await hdKeyring.getAccounts()
    const accounts = {
      hd: hdAccounts.filter((item, pos) => (hdAccounts.indexOf(item) === pos)).map(address => ethUtil.toChecksumAddress(address)),
      simpleKeyPair: [],
      ledger: [],
      trezor: [],
    }

    // transactions

    let transactions = this.txController.store.getState().transactions
    // delete tx for other accounts that we're not importing
    transactions = transactions.filter(tx => {
      const checksummedTxFrom = ethUtil.toChecksumAddress(tx.txParams.from)
      return (
        accounts.hd.includes(checksummedTxFrom)
      )
    })

    return {
      accounts,
      preferences,
      transactions,
      network: this.networkController.store.getState(),
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
    await this.txController.pendingTxTracker.updatePendingTxs()

    try {
      const threeBoxSyncingAllowed = this.threeBoxController.getThreeBoxSyncingState()
      if (threeBoxSyncingAllowed && !this.threeBoxController.box) {
        await this.threeBoxController.new3Box()
        this.threeBoxController.turnThreeBoxSyncingOn()
      } else if (threeBoxSyncingAllowed && this.threeBoxController.box) {
        this.threeBoxController.turnThreeBoxSyncingOn()
      }
    } catch (error) {
      log.error(error)
    }

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

  async getKeyringForDevice (deviceName, hdPath = null) {
    let keyringName = null
    switch (deviceName) {
      case 'trezor':
        keyringName = TrezorKeyring.type
        break
      case 'ledger':
        keyringName = LedgerBridgeKeyring.type
        break
      default:
        throw new Error('MetamaskController:getKeyringForDevice - Unknown device')
    }
    let keyring = await this.keyringController.getKeyringsByType(keyringName)[0]
    if (!keyring) {
      keyring = await this.keyringController.addNewKeyring(keyringName)
    }
    if (hdPath && keyring.setHdPath) {
      keyring.setHdPath(hdPath)
    }

    keyring.network = this.networkController.getProviderConfig().type

    return keyring

  }

  /**
   * Fetch account list from a trezor device.
   *
   * @returns [] accounts
   */
  async connectHardware (deviceName, page, hdPath) {
    const keyring = await this.getKeyringForDevice(deviceName, hdPath)
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
    const oldAccounts = await this.keyringController.getAccounts()
    const accountsToTrack = [...new Set(oldAccounts.concat(accounts.map(a => a.address.toLowerCase())))]
    this.accountTracker.syncWithAddresses(accountsToTrack)
    return accounts
  }

  /**
   * Check if the device is unlocked
   *
   * @returns {Promise<boolean>}
   */
  async checkHardwareStatus (deviceName, hdPath) {
    const keyring = await this.getKeyringForDevice(deviceName, hdPath)
    return keyring.isUnlocked()
  }

  /**
   * Clear
   *
   * @returns {Promise<boolean>}
   */
  async forgetDevice (deviceName) {

    const keyring = await this.getKeyringForDevice(deviceName)
    keyring.forgetDevice()
    return true
  }

  /**
   * Imports an account from a trezor device.
   *
   * @returns {} keyState
   */
  async unlockHardwareWalletAccount (index, deviceName, hdPath) {
    const keyring = await this.getKeyringForDevice(deviceName, hdPath)

    keyring.setAccountToUnlock(index)
    const oldAccounts = await this.keyringController.getAccounts()
    const keyState = await this.keyringController.addNewAccount(keyring)
    const newAccounts = await this.keyringController.getAccounts()
    this.preferencesController.setAddresses(newAccounts)
    newAccounts.forEach(address => {
      if (!oldAccounts.includes(address)) {
        // Set the account label to Trezor 1 /  Ledger 1, etc
        this.preferencesController.setAccountLabel(address, `${deviceName[0].toUpperCase()}${deviceName.slice(1)} ${parseInt(index, 10) + 1}`)
        // Select the account
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
    this.accountTracker.removeAccount([address])

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

  /**
   * Called when a Dapp suggests a new tx to be signed.
   * this wrapper needs to exist so we can provide a reference to
   *  "newUnapprovedTransaction" before "txController" is instantiated
   *
   * @param {Object} msgParams - The params passed to eth_sign.
   * @param {Object} req - (optional) the original request, containing the origin
   */
  async newUnapprovedTransaction (txParams, req) {
    return await this.txController.newUnapprovedTransaction(txParams, req)
  }

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
  newUnsignedMessage (msgParams, req) {
    const promise = this.messageManager.addUnapprovedMessageAsync(msgParams, req)
    this.sendUpdate()
    this.opts.showUnconfirmedMessage()
    return promise
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
  async newUnsignedPersonalMessage (msgParams, req) {
    const promise = this.personalMessageManager.addUnapprovedMessageAsync(msgParams, req)
    this.sendUpdate()
    this.opts.showUnconfirmedMessage()
    return promise
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
  newUnsignedTypedMessage (msgParams, req, version) {
    const promise = this.typedMessageManager.addUnapprovedMessageAsync(msgParams, req, version)
    this.sendUpdate()
    this.opts.showUnconfirmedMessage()
    return promise
  }

  /**
   * The method for a user approving a call to eth_signTypedData, per EIP 712.
   * Triggers the callback in newUnsignedTypedMessage.
   *
   * @param  {Object} msgParams - The params passed to eth_signTypedData.
   * @returns {Object} Full state update.
   */
  async signTypedMessage (msgParams) {
    log.info('MetaMaskController - eth_signTypedData')
    const msgId = msgParams.metamaskId
    const version = msgParams.version
    try {
      const cleanMsgParams = await this.typedMessageManager.approveMessage(msgParams)
      const address = sigUtil.normalize(cleanMsgParams.from)
      const keyring = await this.keyringController.getKeyringForAccount(address)
      let signature
      // HW Wallet keyrings don't expose private keys
      // so we need to handle it separately
      if (!HW_WALLETS_KEYRINGS.includes(keyring.type)) {
        const wallet = keyring._getWalletForAccount(address)
        const privKey = ethUtil.toBuffer(wallet.getPrivateKey())
        switch (version) {
          case 'V1':
            signature = sigUtil.signTypedDataLegacy(privKey, { data: cleanMsgParams.data })
            break
          case 'V3':
            signature = sigUtil.signTypedData(privKey, { data: JSON.parse(cleanMsgParams.data) })
            break
          case 'V4':
            signature = sigUtil.signTypedData_v4(privKey, { data: JSON.parse(cleanMsgParams.data) })
            break
        }
      } else {
        signature = await keyring.signTypedData(address, cleanMsgParams.data)
      }
      this.typedMessageManager.setMsgStatusSigned(msgId, signature)
      return this.getState()
    } catch (error) {
      log.info('MetaMaskController - eth_signTypedData failed.', error)
      this.typedMessageManager.errorMessage(msgId, error)
    }
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
   * This function no longer does anything and will be removed.
   *
   * @deprecated
   * @param {Function} cb - A callback function called with a full state update.
   */
  markAccountsFound (cb) {
    // TODO Remove me
    cb(null, this.getState())
  }

  /**
   * An account object
   * @typedef Account
   * @property string privateKey - The private key of the account.
   */

  //=============================================================================
  // END (VAULT / KEYRING RELATED METHODS)
  //=============================================================================

  /**
   * Allows a user to try to speed up a transaction by retrying it
   * with higher gas.
   *
   * @param {string} txId - The ID of the transaction to speed up.
   */
  async retryTransaction (txId, gasPrice) {
    await this.txController.retryTransaction(txId, gasPrice)
    const state = await this.getState()
    return state
  }

  /**
   * Allows a user to attempt to cancel a previously submitted transaction by creating a new
   * transaction.
   * @param {number} originalTxId - the id of the txMeta that you want to attempt to cancel
   * @param {string=} customGasPrice - the hex value to use for the cancel transaction
   * @returns {object} MetaMask state
   */
  async createCancelTransaction (originalTxId, customGasPrice) {
    try {
      await this.txController.createCancelTransaction(originalTxId, customGasPrice)
      const state = await this.getState()
      return state
    } catch (error) {
      throw error
    }
  }

  async createSpeedUpTransaction (originalTxId, customGasPrice) {
    await this.txController.createSpeedUpTransaction(originalTxId, customGasPrice)
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
    this.preferencesController.setPasswordForgotten(true)
    this.sendUpdate()
    cb()
  }

  /**
   * Allows a user to end the seed phrase recovery process.
   * @param {Function} cb - A callback function called when complete.
   */
  unMarkPasswordForgotten (cb) {
    this.preferencesController.setPasswordForgotten(false)
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
    if (this.phishingController.test(originDomain)) {
      log.debug('MetaMask - sending phishing warning for', originDomain)
      this.sendPhishingWarning(connectionStream, originDomain)
      return
    }

    // setup multiplexing
    const mux = setupMultiplex(connectionStream)
    // connect features
    const publicApi = this.setupPublicApi(mux.createStream('publicApi'), originDomain)
    this.setupProviderConnection(mux.createStream('provider'), originDomain, publicApi)
    this.setupPublicConfig(mux.createStream('publicConfig'), originDomain)
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
    // report new active controller connection
    this.activeControllerConnections++
    this.emit('controllerConnectionChanged', this.activeControllerConnections)
    // connect dnode api to remote connection
    pump(
      outStream,
      dnode,
      outStream,
      (err) => {
        // report new active controller connection
        this.activeControllerConnections--
        this.emit('controllerConnectionChanged', this.activeControllerConnections)
        // report any error
        if (err) log.error(err)
      }
    )
    dnode.on('remote', (remote) => {
      // push updates to popup
      const sendUpdate = (update) => remote.sendUpdate(update)
      this.on('update', sendUpdate)
      // remove update listener once the connection ends
      dnode.on('end', () => this.removeListener('update', sendUpdate))
    })
  }

  /**
   * A method for serving our ethereum provider over a given stream.
   * @param {*} outStream - The stream to provide over.
   * @param {string} origin - The URI of the requesting resource.
   */
  setupProviderConnection (outStream, origin, publicApi) {
    const getSiteMetadata = publicApi && publicApi.getSiteMetadata
    const engine = this.setupProviderEngine(origin, getSiteMetadata)

    // setup connection
    const providerStream = createEngineStream({ engine })

    pump(
      outStream,
      providerStream,
      outStream,
      (err) => {
        // cleanup filter polyfill middleware
        engine._middleware.forEach((mid) => {
          if (mid.destroy && typeof mid.destroy === 'function') {
            mid.destroy()
          }
        })
        if (err) log.error(err)
      }
    )
  }

  /**
   * A method for creating a provider that is safely restricted for the requesting domain.
   **/
  setupProviderEngine (origin, getSiteMetadata) {
    // setup json rpc engine stack
    const engine = new RpcEngine()
    const provider = this.provider
    const blockTracker = this.blockTracker

    // create filter polyfill middleware
    const filterMiddleware = createFilterMiddleware({ provider, blockTracker })

    // create subscription polyfill middleware
    const subscriptionManager = createSubscriptionManager({ provider, blockTracker })
    subscriptionManager.events.on('notification', (message) => engine.emit('notification', message))

    // metadata
    engine.push(createOriginMiddleware({ origin }))
    engine.push(createLoggerMiddleware({ origin }))
    // filter and subscription polyfills
    engine.push(filterMiddleware)
    engine.push(subscriptionManager.middleware)
    // watch asset
    engine.push(this.preferencesController.requestWatchAsset.bind(this.preferencesController))
    // requestAccounts
    engine.push(this.providerApprovalController.createMiddleware({
      origin,
      getSiteMetadata,
    }))
    // forward to metamask primary provider
    engine.push(providerAsMiddleware(provider))
    return engine
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
  setupPublicConfig (outStream, originDomain) {
    const configStore = this.createPublicConfigStore({
      // check the providerApprovalController's approvedOrigins
      checkIsEnabled: () => this.providerApprovalController.shouldExposeAccounts(originDomain),
    })
    const configStream = asStream(configStore)

    pump(
      configStream,
      outStream,
      (err) => {
        configStore.destroy()
        configStream.destroy()
        if (err) log.error(err)
      }
    )
  }

  /**
   * A method for providing our public api over a stream.
   * This includes a method for setting site metadata like title and image
   *
   * @param {*} outStream - The stream to provide the api over.
   */
  setupPublicApi (outStream) {
    const dnode = Dnode()
    // connect dnode api to remote connection
    pump(
      outStream,
      dnode,
      outStream,
      (err) => {
        // report any error
        if (err) log.error(err)
      }
    )

    const getRemote = createDnodeRemoteGetter(dnode)

    const publicApi = {
      // wrap with an await remote
      getSiteMetadata: async () => {
        const remote = await getRemote()
        return await pify(remote.getSiteMetadata)()
      },
    }

    return publicApi
  }

  /**
   * Handle a KeyringController update
   * @param {object} state the KC state
   * @return {Promise<void>}
   * @private
   */
  async _onKeyringControllerUpdate (state) {
    const {isUnlocked, keyrings} = state
    const addresses = keyrings.reduce((acc, {accounts}) => acc.concat(accounts), [])

    if (!addresses.length) {
      return
    }

    // Ensure preferences + identities controller know about all addresses
    this.preferencesController.addAddresses(addresses)
    this.accountTracker.syncWithAddresses(addresses)

    const wasLocked = !isUnlocked
    if (wasLocked) {
      const oldSelectedAddress = this.preferencesController.getSelectedAddress()
      if (!addresses.includes(oldSelectedAddress)) {
        const address = addresses[0]
        await this.preferencesController.setSelectedAddress(address)
      }
    }
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

    const percentileNum = percentile(65, lowestPrices)
    const percentileNumBn = new BN(percentileNum)
    return '0x' + percentileNumBn.mul(GWEI_BN).toString(16)
  }

  /**
   * Returns the nonce that will be associated with a transaction once approved
   * @param address {string} - The hex string address for the transaction
   * @returns Promise<number>
   */
  async getPendingNonce (address) {
    const { nonceDetails, releaseLock} = await this.txController.nonceTracker.getNonceLock(address)
    const pendingNonce = nonceDetails.params.highestSuggested

    releaseLock()
    return pendingNonce
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
    const { ticker } = this.networkController.getNetworkConfig()
    try {
      const currencyState = {
        nativeCurrency: ticker,
        currentCurrency: currencyCode,
      }
      this.currencyRateController.update(currencyState)
      this.currencyRateController.configure(currencyState)
      cb(null, this.currencyRateController.state)
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
    this.shapeshiftController.createTransaction(depositAddress, depositType)
  }

  // network
  /**
   * A method for selecting a custom URL for an ethereum RPC provider and updating it
   * @param {string} rpcUrl - A URL for a valid Ethereum RPC API.
   * @param {number} chainId - The chainId of the selected network.
   * @param {string} ticker - The ticker symbol of the selected network.
   * @param {string} nickname - Optional nickname of the selected network.
   * @returns {Promise<String>} - The RPC Target URL confirmed.
   */

  async updateAndSetCustomRpc (rpcUrl, chainId, ticker = 'ETH', nickname, rpcPrefs) {
    await this.preferencesController.updateRpc({ rpcUrl, chainId, ticker, nickname, rpcPrefs })
    this.networkController.setRpcTarget(rpcUrl, chainId, ticker, nickname, rpcPrefs)
    return rpcUrl
  }


  /**
   * A method for selecting a custom URL for an ethereum RPC provider.
   * @param {string} rpcTarget - A URL for a valid Ethereum RPC API.
   * @param {number} chainId - The chainId of the selected network.
   * @param {string} ticker - The ticker symbol of the selected network.
   * @param {string} nickname - Optional nickname of the selected network.
   * @returns {Promise<String>} - The RPC Target URL confirmed.
   */
  async setCustomRpc (rpcTarget, chainId, ticker = 'ETH', nickname = '', rpcPrefs = {}) {
    const frequentRpcListDetail = this.preferencesController.getFrequentRpcListDetail()
    const rpcSettings = frequentRpcListDetail.find((rpc) => rpcTarget === rpc.rpcUrl)

    if (rpcSettings) {
      this.networkController.setRpcTarget(rpcSettings.rpcUrl, rpcSettings.chainId, rpcSettings.ticker, rpcSettings.nickname, rpcPrefs)
    } else {
      this.networkController.setRpcTarget(rpcTarget, chainId, ticker, nickname, rpcPrefs)
      await this.preferencesController.addToFrequentRpcList(rpcTarget, chainId, ticker, nickname, rpcPrefs)
    }
    return rpcTarget
  }

  /**
   * A method for deleting a selected custom URL.
   * @param {string} rpcTarget - A RPC URL to delete.
   */
  async delCustomRpc (rpcTarget) {
    await this.preferencesController.removeFromFrequentRpcList(rpcTarget)
  }

  async initializeThreeBox () {
    await this.threeBoxController.init()
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
   * Sets whether or not to use the nonce field.
   * @param {boolean} val - True for nonce field, false for not nonce field.
   * @param {Function} cb - A callback function called when complete.
   */
  setUseNonceField (val, cb) {
    try {
      this.preferencesController.setUseNonceField(val)
      cb(null)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * Sets whether or not the user will have usage data tracked with MetaMetrics
   * @param {boolean} bool - True for users that wish to opt-in, false for users that wish to remain out.
   * @param {Function} cb - A callback function called when complete.
   */
  setParticipateInMetaMetrics (bool, cb) {
    try {
      const metaMetricsId = this.preferencesController.setParticipateInMetaMetrics(bool)
      cb(null, metaMetricsId)
    } catch (err) {
      cb(err)
    }
  }

  setMetaMetricsSendCount (val, cb) {
    try {
      this.preferencesController.setMetaMetricsSendCount(val)
      cb(null)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * Sets the type of first time flow the user wishes to follow: create or import
   * @param {String} type - Indicates the type of first time flow the user wishes to follow
   * @param {Function} cb - A callback function called when complete.
   */
  setFirstTimeFlowType (type, cb) {
    try {
      this.preferencesController.setFirstTimeFlowType(type)
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
      const direction = this.preferencesController.setCurrentLocale(key)
      cb(null, direction)
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

  // TODO: Replace isClientOpen methods with `controllerConnectionChanged` events.
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

  /**
  * Creates RPC engine middleware for processing eth_signTypedData requests
  *
  * @param {Object} req - request object
  * @param {Object} res - response object
  * @param {Function} - next
  * @param {Function} - end
  */

  /**
   * Adds a domain to the PhishingController whitelist
   * @param {string} hostname the domain to whitelist
   */
  whitelistPhishingDomain (hostname) {
    return this.phishingController.bypass(hostname)
  }

  /**
   * Locks MetaMask
   */
  setLocked () {
    return this.keyringController.setLocked()
  }
}
