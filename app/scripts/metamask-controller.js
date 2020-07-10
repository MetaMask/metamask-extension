/**
 * @file      The central metamask controller. Aggregates other controllers and exports an api.
 * @copyright Copyright (c) 2018 MetaMask
 * @license   MIT
 */

import EventEmitter from 'events'

import pump from 'pump'
import Dnode from 'dnode'
import extension from 'extensionizer'
import ObservableStore from 'obs-store'
const ComposableObservableStore = require('./lib/ComposableObservableStore')
import asStream from 'obs-store/lib/asStream'
const AccountTracker = require('./lib/account-tracker')
import RpcEngine from 'json-rpc-engine'
import { debounce } from 'lodash'
const createEngineStream = require('json-rpc-middleware-stream/engineStream')
const createFilterMiddleware = require('eth-json-rpc-filters')
const createSubscriptionManager = require('eth-json-rpc-filters/subscriptionManager')
const createOriginMiddleware = require('./lib/createOriginMiddleware')
import createLoggerMiddleware from './lib/createLoggerMiddleware'
import createTabIdMiddleware from './lib/createTabIdMiddleware'
import providerAsMiddleware from 'eth-json-rpc-middleware/providerAsMiddleware'
const setupMultiplex = require('./lib/stream-utils.js').setupMultiplex
const KeyringController = require('eth-keychain-controller')
const NetworkController = require('./controllers/network')
const PreferencesController = require('./controllers/preferences')
const CurrencyController = require('./controllers/currency')
const NoticeController = require('./notice-controller')
const ShapeShiftController = require('./controllers/shapeshift')
const AddressBookController = require('./controllers/address-book')
const InfuraController = require('./controllers/infura')
const CachedBalancesController = require('./controllers/cached-balances')
const RecentBlocksController = require('./controllers/recent-blocks')
import MessageManager from './lib/message-manager'
import DecryptMessageManager from './lib/decrypt-message-manager'
import EncryptionPublicKeyManager from './lib/encryption-public-key-manager'
import PersonalMessageManager from './lib/personal-message-manager'
import TypedMessageManager from './lib/typed-message-manager'
const TransactionController = require('./controllers/transactions')
const BalancesController = require('./controllers/computed-balances')
const TokenRatesController = require('./controllers/token-rates')
const DetectTokensController = require('./controllers/detect-tokens')
import { PermissionsController } from './controllers/permissions'
import getRestrictedMethods from './controllers/permissions/restrictedMethods'
const nodeify = require('./lib/nodeify')
const accountImporter = require('./account-import-strategies')
import { Mutex } from 'await-semaphore'
import selectChainId from './lib/select-chain-id'
const version = require('../manifest.json').version
import ethUtil, { BN } from 'ethereumjs-util'
const GWEI_BN = new BN('1000000000')
const GWEI_10_BN = new BN('10000000000')
import percentile from 'percentile'
import seedPhraseVerifier from './lib/seed-phrase-verifier'
import log from 'loglevel'
const TrezorKeyring = require('eth-trezor-keyring')
const LedgerBridgeKeyring = require('eth-ledger-bridge-keyring')
import EthQuery from 'eth-query'
import nanoid from 'nanoid'
const { importTypes } = require('../../old-ui/app/accounts/import/enums')
const { LEDGER, TREZOR } = require('../../old-ui/app/components/connect-hardware/enum')
const { ifPOA, ifXDai, ifRSK, getNetworkID, getDPath, setDPath } = require('../../old-ui/app/util')
const { GasPriceOracle } = require('gas-price-oracle')

import {
  PhishingController,
} from 'gaba'

const {
  CLASSIC_CODE,
  MAINNET_CODE } = require('./controllers/network/enums')
const accountsPerPage = 5

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

    // external connections by origin
    // Do not modify directly. Use the associated methods.
    this.connections = {}

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

    this.phishingController = new PhishingController()

    // rpc provider
    this.initializeProvider()
    this.provider = this.networkController.getProviderAndBlockTracker().provider
    this.blockTracker = this.networkController.getProviderAndBlockTracker().blockTracker

    // token exchange rate tracker
    this.tokenRatesController = new TokenRatesController({
      preferences: this.preferencesController.store,
    })

    this.recentBlocksController = new RecentBlocksController({
      blockTracker: this.blockTracker,
      provider: this.provider,
      networkController: this.networkController,
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
      } else {
        this.accountTracker.stop()
      }
    })

    this.cachedBalancesController = new CachedBalancesController({
      accountTracker: this.accountTracker,
      getNetwork: this.networkController.getNetworkState.bind(this.networkController),
      initState: initState.CachedBalancesController,
    })

    // ensure accountTracker updates balances after network change
    this.networkController.on('networkDidChange', (newNetworkType, previousNetworkIDStr) => {
      this.keyringController.isCreatedWithCorrectDPath()
      .then(isCreatedWithCorrectDPath => {
        const dPath = getDPath(newNetworkType, isCreatedWithCorrectDPath)
        this.deriveKeyringFromNewDPath(dPath)
        .then(_accounts => {
          this.accountTracker._updateAccounts()
          this.detectTokensController.restartTokenDetection()

          const previousNetworkID = parseInt(previousNetworkIDStr, 10)
          const nextNetwork = getNetworkID({network: newNetworkType})
          const nextNetworkID = parseInt(nextNetwork && nextNetwork.netId, 10)
          if (nextNetworkID !== previousNetworkID) {
            const isPreviousETC = previousNetworkID === CLASSIC_CODE
            const isPreviousRSK = ifRSK(previousNetworkID)
            const isNextETC = nextNetworkID === CLASSIC_CODE
            const isNextRSK = ifRSK(nextNetworkID)
            if (isPreviousETC || isPreviousRSK || isNextETC || isNextRSK) {
              this.forgetDevice(LEDGER, false)
              this.forgetDevice(TREZOR, false)
            }
          }
        })
        .catch(e => {
          console.log(e)
        })
      })
      .catch(e => {
        console.log(e)
      })
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
    this.keyringController.on('unlock', () => this.emit('unlock'))

    this.permissionsController = new PermissionsController({
      getKeyringAccounts: this.keyringController.getAccounts.bind(this.keyringController),
      getRestrictedMethods,
      notifyDomain: this.notifyConnections.bind(this),
      notifyAllDomains: this.notifyAllConnections.bind(this),
      platform: opts.platform,
    }, initState.PermissionsController, initState.PermissionsMetadata)

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
    this.txController.on('newUnapprovedTx', () => opts.showUnapprovedTx())

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
    this.decryptMessageManager = new DecryptMessageManager()
    this.encryptionPublicKeyManager = new EncryptionPublicKeyManager()
    this.typedMessageManager = new TypedMessageManager({ networkController: this.networkController })

    // ensure isClientOpenAndUnlocked is updated when memState updates
    this.on('update', (memState) => {
      this.isClientOpenAndUnlocked = memState.isUnlocked && this._isClientOpen
    })

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
      CachedBalancesController: this.cachedBalancesController.store,
      PermissionsController: this.permissionsController.permissions,
      PermissionsMetadata: this.permissionsController.store,
    })

    this.memStore = new ComposableObservableStore(null, {
      NetworkController: this.networkController.store,
      AccountTracker: this.accountTracker.store,
      TxController: this.txController.memStore,
      BalancesController: this.balancesController.store,
      CachedBalancesController: this.cachedBalancesController.store,
      TokenRatesController: this.tokenRatesController.store,
      MessageManager: this.messageManager.memStore,
      PersonalMessageManager: this.personalMessageManager.memStore,
      DecryptMessageManager: this.decryptMessageManager.memStore,
      EncryptionPublicKeyManager: this.encryptionPublicKeyManager.memStore,
      TypesMessageManager: this.typedMessageManager.memStore,
      KeyringController: this.keyringController.memStore,
      PreferencesController: this.preferencesController.store,
      RecentBlocksController: this.recentBlocksController.store,
      AddressBookController: this.addressBookController.store,
      CurrencyController: this.currencyController.store,
      NoticeController: this.noticeController.memStore,
      ShapeshiftController: this.shapeshiftController.store,
      InfuraController: this.infuraController.store,
      PermissionsController: this.permissionsController.permissions,
      PermissionsMetadata: this.permissionsController.store,
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
      getAccounts: async () => {
        const selectedAddress = this.preferencesController.getSelectedAddress()
        // only show address if account is unlocked
        if (this.isUnlocked && selectedAddress) {
          return [selectedAddress]
        }
        return [] // changing this is a breaking change
      },
      // tx signing
      processTransaction: this.newUnapprovedTransaction.bind(this),
      // msg signing
      processEthSignMessage: this.newUnsignedMessage.bind(this),
      processTypedMessage: this.newUnsignedTypedMessage.bind(this),
      processTypedMessageV3: this.newUnsignedTypedMessage.bind(this),
      processTypedMessageV4: this.newUnsignedTypedMessage.bind(this),
      processPersonalMessage: this.newUnsignedPersonalMessage.bind(this),
      processDecryptMessage: this.newRequestDecryptMessage.bind(this),
      processEncryptionPublicKey: this.newRequestEncryptionPublicKey.bind(this),
      getPendingNonce: this.getPendingNonce.bind(this),
      getPendingTransactionByHash: (hash) => this.txController.getFilteredTxList({ hash, status: 'submitted' })[0],
    }
    const providerProxy = this.networkController.initializeProvider(providerOpts)
    return providerProxy
  }

  /**
   * Constructor helper: initialize a public config store.
   * This store is used to make some config info available to Dapps synchronously.
   */
  createPublicConfigStore () {
    // subset of state for metamask inpage provider
    const publicConfigStore = new ObservableStore()

    // setup memStore subscription hooks
    this.on('update', updatePublicConfigStore)
    updatePublicConfigStore(this.getState())

    publicConfigStore.destroy = () => {
      this.removeEventListener && this.removeEventListener('update', updatePublicConfigStore)
    }

    function updatePublicConfigStore (memState) {
      publicConfigStore.putState(selectPublicState(memState))
    }

    function selectPublicState ({ isUnlocked, network, provider, selectedAddress }) {
      return {
        isUnlocked,
        selectedAddress: isUnlocked ? selectedAddress : undefined,
        networkVersion: network,
        chainId: selectChainId({ network, provider }),
      }
    }
    return publicConfigStore
  }

//=============================================================================
// EXPOSED TO THE UI SUBSYSTEM
//=============================================================================

  /**
   * The metamask-state of the various controllers, made available to the UI
   *
   * @returns {Object} - status
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
    const networkController = this.networkController
    const preferencesController = this.preferencesController
    const txController = this.txController
    const noticeController = this.noticeController
    const addressBookController = this.addressBookController
    // const permissionsController = this.permissionsController

    return {
      // etc
      getState: (cb) => cb(null, this.getState()),
      setCurrentCurrency: this.setCurrentCurrency.bind(this),
      setCurrentCoin: this.setCurrentCoin.bind(this),
      setUseBlockie: this.setUseBlockie.bind(this),
      setUsePhishDetect: this.setUsePhishDetect.bind(this),
      setCurrentLocale: this.setCurrentLocale.bind(this),
      setDProvider: this.setDProvider.bind(this),
      markPasswordForgotten: this.markPasswordForgotten.bind(this),
      unMarkPasswordForgotten: this.unMarkPasswordForgotten.bind(this),
      getGasPrice: nodeify(this.getGasPrice, this),
      getPendingNonce: nodeify(this.getPendingNonce, this),

      // shapeshift
      createShapeShiftTx: this.createShapeShiftTx.bind(this),

      // primary HD keyring management
      addNewAccount: nodeify(this.addNewAccount, this),
      placeSeedWords: this.placeSeedWords.bind(this),
      verifySeedPhrase: nodeify(this.verifySeedPhrase, this),
      clearSeedWordCache: this.clearSeedWordCache.bind(this),
      resetAccount: nodeify(this.resetAccount, this),
      changePassword: nodeify(this.changePassword, this),
      removeAccount: nodeify(this.removeAccount, this),
      updateABI: nodeify(this.updateABI, this),
      getContract: nodeify(this.getContract, this),
      importAccountWithStrategy: nodeify(this.importAccountWithStrategy, this),

      // hardware wallets
      connectHardware: nodeify(this.connectHardware, this),
      connectHardwareAndUnlockAddress: nodeify(this.connectHardwareAndUnlockAddress, this),
      forgetDevice: nodeify(this.forgetDevice, this),
      checkHardwareStatus: nodeify(this.checkHardwareStatus, this),
      unlockHardwareWalletAccount: nodeify(this.unlockHardwareWalletAccount, this),

      // vault management
      submitPassword: nodeify(this.submitPassword, this),

      // network management
      setProviderType: nodeify(networkController.setProviderType, networkController),
      setCustomRpc: nodeify(this.setCustomRpc, this),
      delCustomRpc: nodeify(this.delCustomRpc, this),

      // PreferencesController
      setSelectedAddress: nodeify(preferencesController.setSelectedAddress, preferencesController),
      addToken: nodeify(preferencesController.addToken, preferencesController),
      removeToken: nodeify(preferencesController.removeToken, preferencesController),
      removeRpcUrl: nodeify(preferencesController.removeRpcUrl, preferencesController),
      removeSuggestedTokens: nodeify(preferencesController.removeSuggestedTokens, preferencesController),
      setCurrentAccountTab: nodeify(preferencesController.setCurrentAccountTab, preferencesController),
      setAccountLabel: nodeify(preferencesController.setAccountLabel, preferencesController),
      setFeatureFlag: nodeify(preferencesController.setFeatureFlag, preferencesController),
      setPreference: nodeify(preferencesController.setPreference, preferencesController),

      // BlacklistController
      whitelistPhishingDomain: this.whitelistPhishingDomain.bind(this),

      // AddressController
      setAddressBook: nodeify(addressBookController.setAddressBook, addressBookController),

      // KeyringController
      setLocked: nodeify(keyringController.setLocked, keyringController),
      createNewVaultAndKeychain: nodeify(this.createNewVaultAndKeychain, this),
      createNewVaultAndRestore: nodeify(this.createNewVaultAndRestore, this),
      addNewKeyring: nodeify(keyringController.addNewKeyring, keyringController),
      addNewMultisig: nodeify(keyringController.addNewMultisig, keyringController),
      exportAccount: nodeify(keyringController.exportAccount, keyringController),
      isCreatedWithCorrectDPath: nodeify(keyringController.isCreatedWithCorrectDPath, keyringController),

      // txController
      cancelTransaction: nodeify(txController.cancelTransaction, txController),
      updateTransaction: nodeify(txController.updateTransaction, txController),
      updateAndApproveTransaction: nodeify(txController.updateAndApproveTransaction, txController),
      retryTransaction: nodeify(this.retryTransaction, this),
      createCancelTransaction: nodeify(this.createCancelTransaction, this),
      getFilteredTxList: nodeify(txController.getFilteredTxList, txController),
      isNonceTaken: nodeify(txController.isNonceTaken, txController),
      estimateGas: nodeify(this.estimateGas, this),

      // messageManager
      signMessage: nodeify(this.signMessage, this),
      cancelMessage: this.cancelMessage.bind(this),

      // personalMessageManager
      signPersonalMessage: nodeify(this.signPersonalMessage, this),
      cancelPersonalMessage: this.cancelPersonalMessage.bind(this),

      // typedMessageManager
      signTypedMessage: nodeify(this.signTypedMessage, this),
      cancelTypedMessage: this.cancelTypedMessage.bind(this),

      // decryptMessageManager
      decryptMessage: nodeify(this.decryptMessage, this),
      decryptMessageInline: nodeify(this.decryptMessageInline, this),
      cancelDecryptMessage: this.cancelDecryptMessage.bind(this),

      // notices
      checkNotices: noticeController.updateNoticesList.bind(noticeController),
      markNoticeRead: noticeController.markNoticeRead.bind(noticeController),

      // permissions
      // approvePermissionsRequest: nodeify(permissionsController.approvePermissionsRequest, permissionsController),
      // clearPermissions: permissionsController.clearPermissions.bind(permissionsController),
      // getApprovedAccounts: nodeify(permissionsController.getAccounts.bind(permissionsController)),
      // rejectPermissionsRequest: nodeify(permissionsController.rejectPermissionsRequest, permissionsController),
      // removePermissionsFor: permissionsController.removePermissionsFor.bind(permissionsController),
      // updatePermittedAccounts: nodeify(permissionsController.updatePermittedAccounts, permissionsController),
      // legacyExposeAccounts: nodeify(permissionsController.legacyExposeAccounts, permissionsController),
      handleNewAccountSelected: nodeify(this.handleNewAccountSelected, this),
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
  async createNewVaultAndRestore (password, seed, dPath) {
    const releaseLock = await this.createVaultMutex.acquire()
    try {
      let accounts, lastBalance

      const keyringController = this.keyringController

      // clear known identities
      this.preferencesController.setAddresses([])
      // create new vault
      const networkType = this.networkController.getProviderConfig().type
      const isCreatedWithCorrectDPath = true
      const vault = await keyringController.createNewVaultAndRestore(password, seed, dPath)

      const ethQuery = new EthQuery(this.provider)
      accounts = await keyringController.getAccounts()
      lastBalance = await this.getBalance(accounts[accounts.length - 1], ethQuery)

      const primaryKeyring = keyringController.getKeyringsByType('HD Key Tree')[0]
      if (!primaryKeyring) {
        throw new Error('MetamaskController - No HD Key Tree found')
      }

      setDPath(primaryKeyring, networkType, isCreatedWithCorrectDPath)

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

  /*
   * Submits the user's password and attempts to unlock the vault.
   * Also synchronizes the preferencesController, to ensure its schema
   * is up to date with known accounts once the vault is decrypted.
   *
   * @param {string} password - The user's password
   * @returns {Promise<object>} - The keyringController update.
   */
  async submitPassword (password, dPath) {
    await this.keyringController.submitPassword(password, dPath)
    const accounts = await this.keyringController.getAccounts()

    // verify keyrings
    const nonSimpleKeyrings = this.keyringController.keyrings.filter(keyring => keyring.type !== 'Simple Key Pair' && keyring.type !== 'Simple Address')
    if (nonSimpleKeyrings.length > 1 && this.diagnostics) {
      await this.diagnostics.reportMultipleKeyrings(nonSimpleKeyrings)
    }

    await this.preferencesController.syncAddresses(accounts)
    await this.balancesController.updateAllBalances()
    await this.txController.pendingTxTracker.updatePendingTxs()
    return this.keyringController.fullUpdate()
  }

  async deriveKeyringFromNewDPath (dPath) {
    await this.keyringController.deriveKeyringFromNewDPath(dPath)
    const accounts = await this.keyringController.getAccounts()

    // verify keyrings
    const nonSimpleKeyrings = this.keyringController.keyrings.filter(keyring => keyring.type !== 'Simple Key Pair' && keyring.type !== 'Simple Address')
    if (nonSimpleKeyrings.length > 1 && this.diagnostics) {
      await this.diagnostics.reportMultipleKeyrings(nonSimpleKeyrings)
    }

    await this.preferencesController.syncAddresses(accounts)
    await this.balancesController.updateAllBalances()
    await this.txController.pendingTxTracker.updatePendingTxs()
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
      case TREZOR:
        keyringName = TrezorKeyring.type
        break
      case LEDGER:
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

  connectHardwareAndUnlockAddress (deviceName, hdPath, addressToUnlock) {
    return new Promise(async (resolve, reject) => {
      try {
        const keyring = await this.getKeyringForDevice(deviceName, hdPath)

        const accountsFromFirstPage = await keyring.getFirstPage()
        const initialPage = 0
        let accounts = await this.findAccountInLedger({
          accounts: accountsFromFirstPage,
          keyring,
          page: initialPage,
          addressToUnlock,
          hdPath,
        })
        accounts = accounts || accountsFromFirstPage

        // Merge with existing accounts
        // and make sure addresses are not repeated
        const oldAccounts = await this.keyringController.getAccounts()
        const accountsToTrack = [...new Set(oldAccounts.concat(accounts.map(a => a.address.toLowerCase())))]
        this.accountTracker.syncWithAddresses(accountsToTrack)

        resolve(accountsFromFirstPage)
      } catch (e) {
        reject(e)
      }
    })
  }

  async findAccountInLedger ({accounts, keyring, page, addressToUnlock, hdPath}) {
    return new Promise(async (resolve, reject) => {
      // to do: store pages depth in dropdown
      const pagesDepth = 10
      if (page >= pagesDepth) {
        reject({
          message: `Requested account ${addressToUnlock} is not found in ${pagesDepth} pages of ${hdPath} path of Ledger. Try to unlock this account from Ledger.`,
        })
        return
      }
      if (accounts.length) {
        const accountIsFound = accounts.some((account, ind) => {
          const normalizedAddress = account.address.toLowerCase()
          if (normalizedAddress === addressToUnlock) {
            const indToUnlock = page * accountsPerPage + ind
            keyring.setAccountToUnlock(indToUnlock)
          }
          return normalizedAddress === addressToUnlock
        })

        if (!accountIsFound) {
          accounts = await keyring.getNextPage()
          page++
          this.findAccountInLedger({accounts, keyring, page, addressToUnlock, hdPath})
          .then(accounts => {
            resolve(accounts)
          })
          .catch(e => {
            reject(e)
          })
        } else {
          resolve(accounts)
        }
      }
    })
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
  async forgetDevice (deviceName, clearAccounts) {
    const keyring = await this.getKeyringForDevice(deviceName)
    const accountsToForget = await keyring.forgetDevice(clearAccounts)
    for (const acc of accountsToForget) {
      const accToLower = acc.toLowerCase()
      await this.preferencesController.removeAddress(accToLower)
      await this.accountTracker.removeAccount([accToLower])
    }
    return accountsToForget
  }

  /**
   * Imports an account from a trezor device.
   *
   * @returns {} keyState
   */
  async unlockHardwareWalletAccount (index, deviceName, hdPath) {
    const keyring = await this.getKeyringForDevice(deviceName, hdPath)
    let hdAccounts = await keyring.getFirstPage()
    const accountPosition = Number(index) + 1
    const pages = Math.ceil(accountPosition / accountsPerPage)
    const indexInPage = index % accountsPerPage
    if (pages > 1) {
      for (let iterator = 0; iterator < pages; iterator++) {
        hdAccounts = await keyring.getNextPage()
        iterator++
      }
    }

    keyring.setAccountToUnlock(index)
    const oldAccounts = await this.keyringController.getAccounts()
    const keyState = await this.keyringController.addNewAccount(keyring)
    const newAccounts = await this.keyringController.getAccounts()
    this.preferencesController.setAddresses(newAccounts)

    let selectedAddressChanged = false
    newAccounts.forEach(address => {
      if (!oldAccounts.includes(address)) {
        // Set the account label to Trezor 1 /  Ledger 1, etc
        this.preferencesController.setAccountLabel(address, `${deviceName[0].toUpperCase()}${deviceName.slice(1)} ${parseInt(index, 10) + 1}`)
        // Select the account
        this.preferencesController.setSelectedAddress(address)
        selectedAddressChanged = true
      }
    })

    if (!selectedAddressChanged) {
      // Select the account
      this.preferencesController.setSelectedAddress(hdAccounts[indexInPage].address)
    }

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
    const keyringController = this.keyringController
    const primaryKeyring = keyringController.getKeyringsByType('HD Key Tree')[0]
    if (!primaryKeyring) {
      throw new Error('MetamaskController - No HD Key Tree found')
    }
    const networkType = this.networkController.getProviderConfig().type
    const isCreatedWithCorrectDPath = await keyringController.isCreatedWithCorrectDPath()
    setDPath(primaryKeyring, networkType, isCreatedWithCorrectDPath)
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
        this.preferencesController.setSeedWords(seedWords)
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
    const keyringController = this.keyringController
    const isCreatedWithCorrectDPath = await keyringController.isCreatedWithCorrectDPath()
    const primaryKeyring = keyringController.getKeyringsByType('HD Key Tree')[0]
    if (!primaryKeyring) {
      throw new Error('MetamaskController - No HD Key Tree found')
    }
    const networkType = this.networkController.getProviderConfig().type
    setDPath(primaryKeyring, networkType, isCreatedWithCorrectDPath)

    const serialized = await primaryKeyring.serialize()
    const seedWords = serialized.mnemonic

    const accounts = await primaryKeyring.getAccounts()
    if (accounts.length < 1) {
      throw new Error('MetamaskController - No accounts found')
    }

    try {
      await seedPhraseVerifier.verifyAccounts(accounts, seedWords, networkType, isCreatedWithCorrectDPath)
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
    this.preferencesController.setSeedWords(null)
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

  async getContract (address) {
    let props
    if (this.keyringController.getProps) {
      props = this.keyringController.getProps(address)
    }
    return props
  }

  async changePassword (oldPassword, newPassword, dPath) {
    await this.keyringController.changePassword(oldPassword, newPassword, dPath)
  }

  /**
   * Removes an account from state / storage.
   *
   * @param {string[]} address A hex address
   * @param {int} network ID
   *
   */
  async removeAccount (address, network) {
    // Remove account from the preferences controller
    this.preferencesController.removeAddress(address)
    // Remove account from the account tracker controller
    this.accountTracker.removeAccount([address])

    // Remove account from the keyring
    try {
      await this.keyringController.removeAccount(address, network)
    } catch (e) {
      log.error(e)
    }
    return address
  }

  /**
   * Updates implementation ABI for proxy account type.
   *
   * @param {string[]} address A hex address
   * @param {int} network ID
   *
   */
  async updateABI (address, network, newABI) {
    // Sets new ABI for implementation contract
    try {
      await this.keyringController.updateABI(address, network, newABI)
    } catch (e) {
      log.error(e)
    }
    return
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
    let keyring
    if (strategy === importTypes.CONTRACT.DEFAULT || strategy === importTypes.CONTRACT.PROXY) {
      args.contractType = strategy
      keyring = await this.keyringController.addNewKeyring('Simple Address', args)
    } else {
      const privateKey = await accountImporter.importAccount(strategy, args)
      keyring = await this.keyringController.addNewKeyring('Simple Key Pair', [ privateKey ])
    }
    const accounts = await keyring.getAccounts()
    // update accounts in preferences controller
    const allAccounts = await this.keyringController.getAccounts()
    this.preferencesController.setAddresses(allAccounts)
    // set new account as selected
    await this.preferencesController.setSelectedAddress(accounts[0])
  }

  /**
   * Handle when a new account is selected for the given origin in the UI.
   * Stores the address by origin and notifies external providers associated
   * with the origin.
   * @param {string} origin - The origin for which the address was selected.
   * @param {string} address - The new selected address.
   */
  async handleNewAccountSelected (origin, address) {
    this.permissionsController.handleNewAccountSelected(origin, address)
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
   * @param  {Object} msgParams - The params passed to eth_call.
   * @returns {Promise<Object>} - Full state update.
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

  // eth_decrypt methods

  /**
  * Called when a dapp uses the eth_decrypt method.
  *
  * @param {Object} msgParams - The params of the message to sign & return to the Dapp.
  * @param {Object} req - (optional) the original request, containing the origin
  * Passed back to the requesting Dapp.
  */
  async newRequestDecryptMessage (msgParams, req) {
    const promise = this.decryptMessageManager.addUnapprovedMessageAsync(msgParams, req)
    this.sendUpdate()
    this.opts.showUnconfirmedMessage()
    return promise
  }

  /**
  * Only decypt message and don't touch transaction state
  *
  * @param {Object} msgParams - The params of the message to decrypt.
  * @returns {Promise<Object>} - A full state update.
  */
  async decryptMessageInline (msgParams) {
    log.info('MetaMaskController - decryptMessageInline')
    // decrypt the message inline
    const msgId = msgParams.metamaskId
    const msg = this.decryptMessageManager.getMsg(msgId)
    try {
      const stripped = ethUtil.stripHexPrefix(msgParams.data)
      const buff = Buffer.from(stripped, 'hex')
      msgParams.data = JSON.parse(buff.toString('utf8'))

      msg.rawData = await this.keyringController.decryptMessage(msgParams)
    } catch (e) {
      msg.error = e.message
    }
    this.decryptMessageManager._updateMsg(msg)

    return this.getState()
  }

  /**
  * Signifies a user's approval to decrypt a message in queue.
  * Triggers decrypt, and the callback function from newUnsignedDecryptMessage.
  *
  * @param {Object} msgParams - The params of the message to decrypt & return to the Dapp.
  * @returns {Promise<Object>} - A full state update.
  */
  async decryptMessage (msgParams) {
    log.info('MetaMaskController - decryptMessage')
    const msgId = msgParams.metamaskId
    // sets the status op the message to 'approved'
    // and removes the metamaskId for decryption
    try {
      const cleanMsgParams = await this.decryptMessageManager.approveMessage(msgParams)

      const stripped = ethUtil.stripHexPrefix(cleanMsgParams.data)
      const buff = Buffer.from(stripped, 'hex')
      cleanMsgParams.data = JSON.parse(buff.toString('utf8'))

      // decrypt the message
      const rawMess = await this.keyringController.decryptMessage(cleanMsgParams)
      // tells the listener that the message has been decrypted and can be returned to the dapp
      this.decryptMessageManager.setMsgStatusDecrypted(msgId, rawMess)
    } catch (error) {
      log.info('MetaMaskController - eth_decrypt failed.', error)
      this.decryptMessageManager.errorMessage(msgId, error)
    }
    return this.getState()
  }

  /**
   * Used to cancel a eth_decrypt type message.
   * @param {string} msgId - The ID of the message to cancel.
   * @param {Function} cb - The callback function called with a full state update.
   */
  cancelDecryptMessage (msgId, cb) {
    const messageManager = this.decryptMessageManager
    messageManager.rejectMsg(msgId)
    if (cb && typeof cb === 'function') {
      cb(null, this.getState())
    }
  }

  // eth_getEncryptionPublicKey methods

  /**
  * Called when a dapp uses the eth_getEncryptionPublicKey method.
  *
  * @param {Object} msgParams - The params of the message to sign & return to the Dapp.
  * @param {Object} req - (optional) the original request, containing the origin
  * Passed back to the requesting Dapp.
  */
  async newRequestEncryptionPublicKey (msgParams, req) {
    const promise = this.encryptionPublicKeyManager.addUnapprovedMessageAsync(msgParams, req)
    this.sendUpdate()
    this.opts.showUnconfirmedMessage()
    return promise
  }

  /**
  * Signifies a user's approval to receiving encryption public key in queue.
  * Triggers receiving, and the callback function from newUnsignedEncryptionPublicKey.
  *
  * @param {Object} msgParams - The params of the message to receive & return to the Dapp.
  * @returns {Promise<Object>} - A full state update.
  */
  async encryptionPublicKey (msgParams) {
    log.info('MetaMaskController - encryptionPublicKey')
    const msgId = msgParams.metamaskId
    // sets the status op the message to 'approved'
    // and removes the metamaskId for decryption
    try {
      const params = await this.encryptionPublicKeyManager.approveMessage(msgParams)

      // EncryptionPublicKey message
      const publicKey = await this.keyringController.getEncryptionPublicKey(params.data)

      // tells the listener that the message has been processed
      // and can be returned to the dapp
      this.encryptionPublicKeyManager.setMsgStatusReceived(msgId, publicKey)
    } catch (error) {
      log.info('MetaMaskController - eth_getEncryptionPublicKey failed.', error)
      this.encryptionPublicKeyManager.errorMessage(msgId, error)
    }
    return this.getState()
  }

  /**
   * Used to cancel a eth_getEncryptionPublicKey type message.
   * @param {string} msgId - The ID of the message to cancel.
   * @param {Function} cb - The callback function called with a full state update.
   */
  cancelEncryptionPublicKey (msgId, cb) {
    const messageManager = this.encryptionPublicKeyManager
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
   * @returns {Object} - Full state update.
   */
  async signTypedMessage (msgParams) {
    log.info('MetaMaskController - eth_signTypedData')
    const msgId = msgParams.metamaskId
    const version = msgParams.version
    try {
      const cleanMsgParams = await this.typedMessageManager.approveMessage(msgParams)

      // For some reason every version after V1 used stringified params.
      if (version !== 'V1') {
        // But we don't have to require that. We can stop suggesting it now:
        if (typeof cleanMsgParams.data === 'string') {
          cleanMsgParams.data = JSON.parse(cleanMsgParams.data)
        }
      }

      const signature = await this.keyringController.signTypedMessage(cleanMsgParams, { version })
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

  /**
   * Allows a user to attempt to cancel a previously submitted transaction by creating a new
   * transaction.
   * @param {number} originalTxId - the id of the txMeta that you want to attempt to cancel
   * @param {string=} customGasPrice - the hex value to use for the cancel transaction
   * @returns {object} MetaMask state
   */
  async createCancelTransaction (originalTxId, customGasPrice, cb) {
    await this.txController.createCancelTransaction(originalTxId, customGasPrice)
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
   * A runtime.MessageSender object, as provided by the browser:
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/MessageSender
   * @typedef {Object} MessageSender
   */

  /**
   * Used to create a multiplexed stream for connecting to an untrusted context
   * like a Dapp or other extension.
   * @param {*} connectionStream - The Duplex stream to connect to.
   * @param {MessageSender} sender - The sender of the messages on this stream
   */
  setupUntrustedCommunication (connectionStream, sender) {
    const { usePhishDetect } = this.preferencesController.store.getState()
    const hostname = (new URL(sender.url)).hostname
    // Check if new connection is blacklisted if phishing detection is on
    if (usePhishDetect && this.phishingController.test(hostname)) {
      log.debug('Nifty Wallet - sending phishing warning for', hostname)
      this.sendPhishingWarning(connectionStream, hostname)
      return
    }

    // setup multiplexing
    const mux = setupMultiplex(connectionStream)

    // messages between inpage and background
    this.setupProviderConnection(mux.createStream('provider'), sender)
    this.setupPublicConfig(mux.createStream('publicConfig'))
  }

  /**
   * Used to create a multiplexed stream for connecting to a trusted context,
   * like our own user interfaces, which have the provider APIs, but also
   * receive the exported API from this controller, which includes trusted
   * functions, like the ability to approve transactions or sign messages.
   *
   * @param {*} connectionStream - The duplex stream to connect to.
   * @param {MessageSender} sender - The sender of the messages on this stream
   */
  setupTrustedCommunication (connectionStream, sender) {
    // setup multiplexing
    const mux = setupMultiplex(connectionStream)
    // connect features
    this.setupControllerConnection(mux.createStream('controller'))
    this.setupProviderConnection(mux.createStream('provider'), sender, true)
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
        if (err) {
          log.error(err)
        }
      },
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
   * @param {MessageSender} sender - The sender of the messages on this stream
   * @param {boolean} isInternal - True if this is a connection with an internal process
   */
  setupProviderConnection (outStream, sender, isInternal) {
    const origin = isInternal
      ? 'metamask'
      : (new URL(sender.url)).hostname
    let extensionId
    if (sender.id !== extension.runtime.id) {
      extensionId = sender.id
    }
    let tabId
    if (sender.tab && sender.tab.id) {
      tabId = sender.tab.id
    }

    const engine = this.setupProviderEngine({ origin, location: sender.url, extensionId, tabId })

    // setup connection
    const providerStream = createEngineStream({ engine })

    const connectionId = this.addConnection(origin, { engine })

    pump(
      outStream,
      providerStream,
      outStream,
      (err) => {
        // handle any middleware cleanup
        engine._middleware.forEach((mid) => {
          if (mid.destroy && typeof mid.destroy === 'function') {
            mid.destroy()
          }
        })
        connectionId && this.removeConnection(origin, connectionId)
        if (err) {
          log.error(err)
        }
      },
    )
  }

  /**
   * A method for creating a provider that is safely restricted for the requesting domain.
   * @param {Object} options - Provider engine options
   * @param {string} options.origin - The hostname of the sender
   * @param {string} options.location - The full URL of the sender
   * @param {extensionId} [options.extensionId] - The extension ID of the sender, if the sender is an external extension
   * @param {tabId} [options.tabId] - The tab ID of the sender - if the sender is within a tab
   **/
  setupProviderEngine ({ origin, location, extensionId, tabId }) {
    // setup json rpc engine stack
    const engine = new RpcEngine()
    const provider = this.provider
    const blockTracker = this.blockTracker

    // create filter polyfill middleware
    const filterMiddleware = createFilterMiddleware({ provider, blockTracker })

    // create subscription polyfill middleware
    const subscriptionManager = createSubscriptionManager({ provider, blockTracker })
    subscriptionManager.events.on('notification', (message) => engine.emit('notification', message))

    // append origin to each request
    engine.push(createOriginMiddleware({ origin }))
    // append tabId to each request if it exists
    if (tabId) {
      engine.push(createTabIdMiddleware({ tabId }))
    }
    // logging
    engine.push(createLoggerMiddleware({ origin }))
    // filter and subscription polyfills
    engine.push(filterMiddleware)
    engine.push(subscriptionManager.middleware)
    // permissions
    // engine.push(this.permissionsController.createMiddleware({ origin, extensionId }))
    // watch asset
    engine.push(this.preferencesController.requestWatchAsset.bind(this.preferencesController))
    // sign typed data middleware
    engine.push(this.createTypedDataMiddleware('eth_signTypedData', 'V1').bind(this))
    engine.push(this.createTypedDataMiddleware('eth_signTypedData_v1', 'V1').bind(this))
    engine.push(this.createTypedDataMiddleware('eth_signTypedData_v3', 'V3', true).bind(this))
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
  setupPublicConfig (outStream) {
    const configStore = this.createPublicConfigStore()
    const configStream = asStream(configStore)

    pump(
      configStream,
      outStream,
      (err) => {
        configStore.destroy()
        configStream.destroy()
        if (err) {
          log.error(err)
        }
      },
    )
  }

  /**
   * Adds a reference to a connection by origin. Ignores the 'metamask' origin.
   * Caller must ensure that the returned id is stored such that the reference
   * can be deleted later.
   *
   * @param {string} origin - The connection's origin string.
   * @param {Object} options - Data associated with the connection
   * @param {Object} options.engine - The connection's JSON Rpc Engine
   * @returns {string} - The connection's id (so that it can be deleted later)
   */
  addConnection (origin, { engine }) {

    if (origin === 'metamask') {
      return null
    }

    if (!this.connections[origin]) {
      this.connections[origin] = {}
    }

    const id = nanoid()
    this.connections[origin][id] = {
      engine,
    }

    return id
  }

  /**
   * Deletes a reference to a connection, by origin and id.
   * Ignores unknown origins.
   *
   * @param {string} origin - The connection's origin string.
   * @param {string} id - The connection's id, as returned from addConnection.
   */
  removeConnection (origin, id) {

    const connections = this.connections[origin]
    if (!connections) {
      return
    }

    delete connections[id]

    if (Object.keys(connections.length === 0)) {
      delete this.connections[origin]
    }
  }

  /**
   * Causes the RPC engines associated with the connections to the given origin
   * to emit a notification event with the given payload.
   * Does nothing if the extension is locked or the origin is unknown.
   *
   * @param {string} origin - The connection's origin string.
   * @param {any} payload - The event payload.
   */
  notifyConnections (origin, payload) {

    const { isUnlocked } = this.getState()
    const connections = this.connections[origin]
    if (!isUnlocked || !connections) {
      return
    }

    Object.values(connections).forEach((conn) => {
      conn.engine && conn.engine.emit('notification', payload)
    })
  }

  /**
   * Causes the RPC engines associated with all connections to emit a
   * notification event with the given payload.
   * Does nothing if the extension is locked.
   *
   * @param {any} payload - The event payload.
   */
  notifyAllConnections (payload) {

    const { isUnlocked } = this.getState()
    if (!isUnlocked) {
      return
    }

    Object.values(this.connections).forEach((origin) => {
      Object.values(origin).forEach((conn) => {
        conn.engine && conn.engine.emit('notification', payload)
      })
    })
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
   * @returns {boolean} Whether the extension is unlocked.
   */
  isUnlocked () {
    return this.keyringController.memStore.getState().isUnlocked
  }

  /**
   * A method for estimating a good gas price
   * For ETH, ETC: from gas price oracles
   * For other networks: from recent blocks
   *
   * @returns {string} A hex representation of the suggested wei gas price.
   */
  async getGasPrice () {
    return new Promise(async (resolve) => {
      const { networkController } = this

      const networkIdStr = networkController.store.getState().network
      const networkId = parseInt(networkIdStr)
      const isETHC = networkId === CLASSIC_CODE || networkId === MAINNET_CODE
      const isRSK = ifRSK(networkId)
      let gasPrice

      if (isETHC) {
        try {
          gasPrice = await this.getGasPriceFromOracles(networkId)
          if (gasPrice) {
            const gasPriceBN = new BN(gasPrice)
            gasPrice = gasPriceBN.mul(GWEI_BN)
            resolve('0x' + gasPrice.toString(16))
          }
        } catch (error) {
          log.error(error)
          gasPrice = this.getGasPriceFromBlocks(networkId)
          resolve(gasPrice)
        }
      } else if (isRSK) {
        gasPrice = this.getGasPriceFromLastBlockRSK()
        resolve(gasPrice)
      } else {
        gasPrice = this.getGasPriceFromBlocks(networkId)
        resolve(gasPrice)
      }
    })
  }

  /**
   * A method for estimating a good gas price at recent prices.
   * Returns the lowest price that would have been included in
   * 50% of recent blocks.
   *
   * @returns {string} A hex representation of the suggested wei gas price.
   */
  getGasPriceFromBlocks (networkId) {
    const { recentBlocksController } = this
    const { recentBlocks } = recentBlocksController.store.getState()
    const isPOA = ifPOA(networkId)
    const isXDai = ifXDai(networkId)

    // Return 10 gwei if using a POA, Sokol
    if (isPOA) {
      return '0x' + GWEI_10_BN.toString(16)
    }

    // Return 1 gwei if xDai or there are no blocks have been observed:
    if (isXDai || recentBlocks.length === 0) {
      return '0x' + GWEI_BN.toString(16)
    }

    const lowestPrices = recentBlocks.map((block) => {
      if (!block.gasPrices || block.gasPrices.length < 1) {
        return GWEI_BN
      }
      const filteredGasPrices = block.gasPrices.filter((block) => block !== '0x00')
      return filteredGasPrices
      .map(hexPrefix => hexPrefix.substr(2))
      .map(hex => new BN(hex, 16))
      .sort((a, b) => {
        return a.gt(b) ? 1 : -1
      })[0]
    })
    .map(number => number && number.div(GWEI_BN).toNumber()).filter(number => typeof number !== 'undefined' && number !== 0)

    const percentileNum = percentile(65, lowestPrices)
    const percentileNumBn = new BN(percentileNum)
    return '0x' + percentileNumBn.mul(GWEI_BN).toString(16)
  }

  /**
   * A method to get min gas price from the best block (last block in the chain) for RSK.
   * https://github.com/rsksmart/RSKIPs/blob/master/IPs/RSKIP09.md
   * Related issue: https://github.com/poanetwork/nifty-wallet/issues/301
   * @returns {string} A hex representation of the suggested wei gas price.
   */
  getGasPriceFromLastBlockRSK () {
    const { recentBlocksController } = this
    const { recentBlocks } = recentBlocksController.store.getState()

    const recentBlock = recentBlocks
      .sort((block1, block2) => block1.number - block2.number)[recentBlocks.length - 1]

    const gasPrice = recentBlock && recentBlock.minimumGasPrice && recentBlock.minimumGasPrice.toString()

    if (gasPrice !== '0x' && gasPrice !== '0x0' && gasPrice !== '') {
      return gasPrice
    } else {
      return '0x' + GWEI_BN.toString(16)
    }
  }

  /**
   * A method for retrieving of gas price from POA gas price oracles
   *
   * @returns {string} A hex representation of the suggested wei gas price.
   */
  getGasPriceFromOracles (networkId) {
    return new Promise(async (resolve, reject) => {
      if (networkId === MAINNET_CODE) {
        const oracle = new GasPriceOracle()
        // optional fallbackGasPrices
        const fallbackGasPrices = {
            instant: 70, fast: 31, standard: 20, low: 7,
        }
        oracle.gasPrices(fallbackGasPrices).then((gasPrices) => {
          gasPrices && (gasPrices.standard || gasPrices.fast) ? resolve(gasPrices.standard || gasPrices.fast) : reject()
        })
      } else if (networkId === CLASSIC_CODE) {
        const gasPriceOracleETC = 'https://gasprice-etc.poa.network'
        try {
          const response = await fetch(gasPriceOracleETC)
          const parsedResponse = await response.json()
          if (parsedResponse && (parsedResponse.standard || parsedResponse.fast)) {
            resolve(parsedResponse.standard || parsedResponse.fast)
          } else {
            reject('Empty response from gas price oracle')
          }
        } catch (error) {
          reject(error)
        }
      } else {
        reject(`No gas price oracles for ${networkId}`)
      }
    })
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
   * A method for setting the network coin.
   * @param {string} coinCode - The code of the coin.
   * @param {Function} cb - A callback function returning currency info.
   */
  async setCurrentCoin (coinCode, cb) {
    try {
      this.currencyController.setCurrentCoin(coinCode)
      await this.currencyController.updateConversionRate()
      const data = {
        conversionRate: this.currencyController.getConversionRate(),
        currentCoin: this.currencyController.getCurrentCoin(),
        currentCurrency: this.currencyController.getCurrentCurrency(),
        conversionDate: this.currencyController.getConversionDate(),
      }
      cb(null, data)
    } catch (err) {
      cb(err)
    }
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
   * A method for deleting a selected custom URL.
   * @param {string} rpcTarget - A RPC URL to delete.
   */
  async delCustomRpc (rpcTarget) {
    await this.preferencesController.updateFrequentRpcList(rpcTarget, true)
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
   * Sets whether or not to use phishing detection.
   * @param {boolean} val
   * @param {Function} cb
   */
  setUsePhishDetect (val, cb) {
    try {
      this.preferencesController.setUsePhishDetect(val)
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
   * A method for setting a user's preference of decent provider
   * @param {string} key - boolean for decentralized provider
   * @param {Function} cb - A callback function called when complete.
   */
  setDProvider (key, cb) {
    try {
      this.networkController.setDProvider(key)
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

  // TODO: Replace isClientOpen methods with `controllerConnectionChanged` events.
  /**
   * A method for recording whether the MetaMask user interface is open or not.
   * @private
   * @param {boolean} open
   */
  set isClientOpen (open) {
    this._isClientOpen = open
    this.isClientOpenAndUnlocked = this.isUnlocked() && open
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
  createTypedDataMiddleware (methodName, version, reverse) {
    return async (req, res, next, end) => {
      const { method, params } = req
      if (method === methodName) {
        const promise = this.typedMessageManager.addUnapprovedMessageAsync({
          data: reverse ? params[1] : params[0],
          from: reverse ? params[0] : params[1],
        }, req, version)
        this.sendUpdate()
        this.opts.showUnconfirmedMessage()
        try {
          res.result = await promise
          end()
        } catch (error) {
          end(error)
        }
      } else {
        next()
      }
    }
  }

    /**
   * Adds a domain to the PhishingController whitelist
   * @param {string} hostname - the domain to whitelist
   */
  whitelistPhishingDomain (hostname) {
    return this.phishingController.bypass(hostname)
  }
}
