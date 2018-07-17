const assert = require('assert')
const EventEmitter = require('events')
const createMetamaskProvider = require('web3-provider-engine/zero.js')
const SubproviderFromProvider = require('web3-provider-engine/subproviders/provider.js')
const createInfuraProvider = require('eth-json-rpc-infura/src/createProvider')
const ObservableStore = require('obs-store')
const ComposedStore = require('obs-store/lib/composed')
const extend = require('xtend')
const EthQuery = require('eth-query')
const createEventEmitterProxy = require('../../lib/events-proxy.js')
const log = require('loglevel')
const networks = require('./networks')

const {
  MAINNET,
  CLASSIC,
  ROPSTEN,
  RINKEBY,
  KOVAN,
  LOCALHOST,
} = require('./enums')
const LOCALHOST_RPC_URL = 'http://localhost:8545'
const INFURA_PROVIDER_TYPES = [MAINNET, ROPSTEN, RINKEBY, KOVAN]
const ALL_PROVIDER_TYPES = [MAINNET, CLASSIC, ROPSTEN, RINKEBY, KOVAN]

const env = process.env.METAMASK_ENV
const METAMASK_DEBUG = process.env.METAMASK_DEBUG
const testMode = (METAMASK_DEBUG || env === 'test')

const defaultProviderConfig = {
  type: testMode ? RINKEBY : MAINNET,
}

const defaultNetworkConfig = {
  type: 'mainnet', ticker: 'ETH',
}

module.exports = class NetworkController extends EventEmitter {

  constructor (opts = {}) {
    super()

    // parse options
    const providerConfig = opts.provider || defaultProviderConfig
    // create stores
    this.providerStore = new ObservableStore(providerConfig)
    this.networkStore = new ObservableStore('loading')
    this.networkConfig = new ObservableStore(defaultNetworkConfig)
    this.store = new ComposedStore({ provider: this.providerStore, network: this.networkStore, settings: this.networkConfig })
    // create event emitter proxy
    this._proxy = createEventEmitterProxy()

    this.on('networkDidChange', this.lookupNetwork)
  }

  initializeProvider (_providerParams) {
    this._baseProviderParams = _providerParams
    const { type, rpcTarget, chainId } = this.providerStore.getState()
    this._configureProvider({ type, rpcTarget, chainId })
    this._proxy.on('block', this._logBlock.bind(this))
    this._proxy.on('error', this.verifyNetwork.bind(this))
    this.ethQuery = new EthQuery(this._proxy)
    this.lookupNetwork(type)
    return this._proxy
  }

  verifyNetwork () {
    // Check network when restoring connectivity:
    const { type } = this.providerStore.getState()
    if (this.isNetworkLoading()) this.lookupNetwork(type)
  }

  getNetworkState () {
    return this.networkStore.getState()
  }

  getNetworkConfig () {
    return this.networkConfig.getState()
  }

  setNetworkState (network, type) {
    if (network === 'loading') {
      return this.networkStore.putState(network)
    }

    // type must be defined
    if (!type) {
      return
    }
    network = networks.networkList[type] && networks.networkList[type].chainId ? networks.networkList[type].chainId : network
    console.info('type = ' + type + ', network (chainId) = ' + network)
    return this.networkStore.putState(network)
  }

  isNetworkLoading () {
    return this.getNetworkState() === 'loading'
  }

  lookupNetwork (newtype) {
    // Prevent firing when provider is not defined.
    if (!this.ethQuery || !this.ethQuery.sendAsync) {
      return log.warn('NetworkController - lookupNetwork aborted due to missing ethQuery')
    }
    var { type } = this.providerStore.getState()
    if (!newtype) {
      newtype = type
    }

    this.ethQuery.sendAsync({ method: 'net_version' }, (err, network) => {
      if (err) return this.setNetworkState('loading')
      log.info('web3.getNetwork returned ' + network)
      console.info('type = ' + newtype + ' / web3.getNetwork returned ' + network)
      this.setNetworkState(network, newtype)
    })
  }

  setRpcTarget (rpcTarget, chainId) {
    const providerConfig = {
      type: 'rpc',
      rpcTarget,
      chainId,
    }
    this.providerConfig = providerConfig
  }

  async setProviderType (type) {
    assert.notEqual(type, 'rpc', `NetworkController - cannot call "setProviderType" with type 'rpc'. use "setRpcTarget"`)
    assert(ALL_PROVIDER_TYPES.includes(type) || type === LOCALHOST, `NetworkController - Unknown rpc type "${type}"`)
    const providerConfig = { type }
    this.providerConfig = providerConfig
  }

  resetConnection () {
    this.providerConfig = this.getProviderConfig()
  }

  set providerConfig (providerConfig) {
    this.providerStore.updateState(providerConfig)
    this._switchNetwork(providerConfig)
  }

  getProviderConfig () {
    return this.providerStore.getState()
  }

  //
  // Private
  //

  _switchNetwork (opts) {
    this.setNetworkState('loading')
    this._configureProvider(opts)
    this.emit('networkDidChange')
  }

  _configureProvider (opts) {
    const { type, rpcTarget, chainId } = opts
    // infura type-based endpoints
    const isInfura = INFURA_PROVIDER_TYPES.includes(type)
    if (isInfura) {
      this._configureInfuraProvider(opts)
    // other predefined endpoints
    } else if (ALL_PROVIDER_TYPES.includes(type)){
      this._configurePredefinedProvider(opts)
    // other type-based rpc endpoints
    } else if (type === LOCALHOST) {
      this._configureStandardProvider({ rpcUrl: LOCALHOST_RPC_URL })
    // url-based rpc endpoints
    } else if (type === 'rpc') {
      this._configureStandardProvider({ rpcUrl: rpcTarget, chainId })
    } else {
      throw new Error(`NetworkController - _configureProvider - unknown type "${type}"`)
    }
  }

  _configureInfuraProvider ({ type }) {
    log.info('_configureInfuraProvider', type)
    const infuraProvider = createInfuraProvider({ network: type })
    const infuraSubprovider = new SubproviderFromProvider(infuraProvider)
    const providerParams = extend(this._baseProviderParams, {
      engineParams: {
        pollingInterval: 8000,
        blockTrackerProvider: infuraProvider,
      },
      dataSubprovider: infuraSubprovider,
    })
    // setup networkConfig
    var settings = {
      type,
      ticker: 'ETH',
    }
    this.networkConfig.putState(settings)
    const provider = createMetamaskProvider(providerParams)
    this._setProvider(provider)
  }

  _configurePredefinedProvider ({ type }) {
    log.info('_configurePredefinedProvider', type)
    const providerParams = extend(this._baseProviderParams, {
      type,
      rpcUrl: networks.networkList[type].rpcUrl,
      engineParams: {
        pollingInterval: networks.networkList[type].pollingInterval || 8000,
      },
    })
    // setup networkConfig
    if (networks.networkList[type]) {
      var settings = {
        type,
        network: networks.networkList[type].chainId,
      }
      settings = extend(settings, networks.networkList[type])
      this.networkConfig.putState(settings)
    }
    const provider = createMetamaskProvider(providerParams)
    this._setProvider(provider)
  }

  _configureStandardProvider ({ rpcUrl, chainId }) {
    const providerParams = extend(this._baseProviderParams, {
      rpcUrl,
      engineParams: {
        pollingInterval: 8000,
      },
    })
    // hack to add a 'rpc' network with chainId
    networks.networkList['rpc'] = {
      chainId: chainId,
      rpcUrl,
      ticker: 'ETH',
    }
    // setup networkConfig
    var settings = {
      type: 'rpc',
      network: chainId,
    }
    settings = extend(settings, networks.networkList['rpc'])
    this.networkConfig.putState(settings)
    const provider = createMetamaskProvider(providerParams)
    this._setProvider(provider)
  }

  _setProvider (provider) {
    // collect old block tracker events
    const oldProvider = this._provider
    let blockTrackerHandlers
    if (oldProvider) {
      // capture old block handlers
      blockTrackerHandlers = oldProvider._blockTracker.proxyEventHandlers
      // tear down
      oldProvider.removeAllListeners()
      oldProvider.stop()
    }
    // override block tracler
    provider._blockTracker = createEventEmitterProxy(provider._blockTracker, blockTrackerHandlers)
    // set as new provider
    this._provider = provider
    this._proxy.setTarget(provider)
  }

  _logBlock (block) {
    log.info(`BLOCK CHANGED: #${block.number.toString('hex')} 0x${block.hash.toString('hex')}`)
    this.verifyNetwork()
  }
}
