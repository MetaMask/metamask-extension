const assert = require('assert')
const EventEmitter = require('events')
const createMetamaskProvider = require('web3-provider-engine/zero.js')
const SubproviderFromProvider = require('web3-provider-engine/subproviders/web3.js')
const createInfuraProvider = require('../lib/akaCreateProvider.js')
const ObservableStore = require('obs-store')
const ComposedStore = require('obs-store/lib/composed')
const extend = require('xtend')
const EthQuery = require('eth-query')
const createEventEmitterProxy = require('../lib/events-proxy.js')
const networkConfig = require('../config.js')
const { OLD_UI_NETWORK_TYPE, DEFAULT_RPC } = networkConfig.enums
const INFURA_PROVIDER_TYPES = ['mainnet']

module.exports = class NetworkController extends EventEmitter {

  constructor (config) {
    super()

    this._networkEndpointVersion = OLD_UI_NETWORK_TYPE
    this._networkEndpoints = this.getNetworkEndpoints(OLD_UI_NETWORK_TYPE)
    this._defaultRpc = this._networkEndpoints[DEFAULT_RPC]

    config.provider.rpcTarget = this.getRpcAddressForType(config.provider.type, config.provider)
    this.networkStore = new ObservableStore('loading')
    this.providerStore = new ObservableStore(config.provider)
    this.store = new ComposedStore({ provider: this.providerStore, network: this.networkStore })
    this._proxy = createEventEmitterProxy()

    this.on('networkDidChange', this.lookupNetwork)
  }

  async setNetworkEndpoints (version) {
    if (version === this._networkEndpointVersion) {
      return
    }

    this._networkEndpointVersion = version
    this._networkEndpoints = this.getNetworkEndpoints(version)
    this._defaultRpc = this._networkEndpoints[DEFAULT_RPC]
    const { type } = this.getProviderConfig()

    return this.setProviderType(type, true)
  }

  getNetworkEndpoints (version = OLD_UI_NETWORK_TYPE) {
    return networkConfig[version]
  }

  initializeProvider (_providerParams) {
    this._baseProviderParams = _providerParams
    const { type, rpcTarget } = this.providerStore.getState()
    // map rpcTarget to rpcUrl
    const opts = {
      type,
      rpcUrl: rpcTarget,
    }
    this._configureProvider(opts)
    this._proxy.on('block', this._logBlock.bind(this))
    this._proxy.on('error', this.verifyNetwork.bind(this))
    this.ethQuery = new EthQuery(this._proxy)
    this.lookupNetwork()
    return this._proxy
  }

  verifyNetwork () {
    // Check network when restoring connectivity:
    if (this.isNetworkLoading()) this.lookupNetwork()
  }

  getNetworkState () {
    return this.networkStore.getState()
  }

  setNetworkState (network) {
    return this.networkStore.putState(network)
  }

  isNetworkLoading () {
    return this.getNetworkState() === 'loading'
  }

  lookupNetwork () {
    // Prevent firing when provider is not defined.
    if (!this.ethQuery || !this.ethQuery.sendAsync) {
      return log.warn('NetworkController - lookupNetwork aborted due to missing ethQuery')
    }
    this.ethQuery.sendAsync({ method: 'net_version' }, (err, network) => {
      if (err) return this.setNetworkState('loading')
      log.info('web3.getNetwork returned ' + network)
      this.setNetworkState(network)
    })
  }

  setRpcTarget (rpcUrl) {
    this.providerStore.updateState({
      type: 'rpc',
      rpcTarget: rpcUrl,
    })
    this._switchNetwork({ rpcUrl })
  }

  getCurrentRpcAddress () {
    const provider = this.getProviderConfig()
    if (!provider) return null
    return this.getRpcAddressForType(provider.type)
  }

  async setProviderType (type, forceUpdate = false) {
    assert(type !== 'rpc', `NetworkController.setProviderType - cannot connect by type "rpc"`)
    // skip if type already matches
    if (type === this.getProviderConfig().type && !forceUpdate) {
      return
    }

    const rpcTarget = this.getRpcAddressForType(type)
    assert(rpcTarget, `NetworkController - unknown rpc address for type "${type}"`)
    this.providerStore.updateState({ type, rpcTarget })
    this._switchNetwork({ type })
  }

  getProviderConfig () {
    return this.providerStore.getState()
  }

  getRpcAddressForType (type, provider = this.getProviderConfig()) {
    if (this._networkEndpoints[type]) {
      return this._networkEndpoints[type]
    }

    return provider && provider.rpcTarget ? provider.rpcTarget : this._defaultRpc
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
    // type-based rpc endpoints
    const { type } = opts
    if (type) {
      // type-based infura rpc endpoints
      const isInfura = INFURA_PROVIDER_TYPES.includes(type)
      opts.rpcUrl = this.getRpcAddressForType(type)
      if (isInfura) {
        this._configureInfuraProvider(opts)
      // other type-based rpc endpoints
      } else {
        this._configureStandardProvider(opts)
      }
    // url-based rpc endpoints
    } else {
      this._configureStandardProvider(opts)
    }
  }

  _configureInfuraProvider (opts) {
    log.info('_configureInfuraProvider', opts)
    const infuraProvider = createInfuraProvider({
      network: opts.type,
    })
    const infuraSubprovider = new SubproviderFromProvider(infuraProvider)
    const providerParams = extend(this._baseProviderParams, {
      rpcUrl: opts.rpcUrl,
      engineParams: {
        pollingInterval: 8000,
        blockTrackerProvider: infuraProvider,
      },
      dataSubprovider: infuraSubprovider,
    })
    const provider = createMetamaskProvider(providerParams)
    this._setProvider(provider)
  }

  _configureStandardProvider ({ rpcUrl }) {
    const providerParams = extend(this._baseProviderParams, {
      rpcUrl,
      engineParams: {
        pollingInterval: 8000,
      },
    })
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
