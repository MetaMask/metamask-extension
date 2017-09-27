const EventEmitter = require('events')
const MetaMaskProvider = require('web3-provider-engine/zero.js')
const ObservableStore = require('obs-store')
const ComposedStore = require('obs-store/lib/composed')
const extend = require('xtend')
const EthQuery = require('eth-query')
const createEventEmitterProxy = require('../lib/events-proxy.js')
const RPC_ADDRESS_LIST = require('../config.js').network
const DEFAULT_RPC = RPC_ADDRESS_LIST['rinkeby']

module.exports = class NetworkController extends EventEmitter {
  constructor (config) {
    super()
    config.provider.rpcTarget = this.getRpcAddressForType(config.provider.type, config.provider)
    this.networkStore = new ObservableStore('loading')
    this.providerStore = new ObservableStore(config.provider)
    this.store = new ComposedStore({ provider: this.providerStore, network: this.networkStore })
    this._proxy = createEventEmitterProxy()

    this.on('networkDidChange', this.lookupNetwork)
    this.providerStore.subscribe((state) => this.switchNetwork({ rpcUrl: state.rpcTarget }))
  }

  initializeProvider (opts, providerContructor = MetaMaskProvider) {
    this._baseProviderParams = opts
    const provider = providerContructor(opts)
    this._setProvider(provider)
    this._proxy.on('block', this._logBlock.bind(this))
    this._proxy.on('error', this.verifyNetwork.bind(this))
    this.ethQuery = new EthQuery(this._proxy)
    this.lookupNetwork()
    return this._proxy
  }

  switchNetwork (opts) {
    this.setNetworkState('loading')
    const providerParams = extend(this._baseProviderParams, opts)
    this._baseProviderParams = providerParams
    const provider = MetaMaskProvider(providerParams)
    this._setProvider(provider)
    this.emit('networkDidChange')
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
  }

  getCurrentRpcAddress () {
    const provider = this.getProviderConfig()
    if (!provider) return null
    return this.getRpcAddressForType(provider.type)
  }

  setProviderType (type) {
    if (type === this.getProviderConfig().type) return
    const rpcTarget = this.getRpcAddressForType(type)
    this.providerStore.updateState({type, rpcTarget})
  }

  getProviderConfig () {
    return this.providerStore.getState()
  }

  getRpcAddressForType (type, provider = this.getProviderConfig()) {
    if (RPC_ADDRESS_LIST[type]) return RPC_ADDRESS_LIST[type]
    return provider && provider.rpcTarget ? provider.rpcTarget : DEFAULT_RPC
  }

  _logBlock (block) {
    log.info(`BLOCK CHANGED: #${block.number.toString('hex')} 0x${block.hash.toString('hex')}`)
    this.verifyNetwork()
  }
}
