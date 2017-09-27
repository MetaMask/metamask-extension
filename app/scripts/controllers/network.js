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
    this._providerListeners = {}

    this.on('networkDidChange', this.lookupNetwork)
    this.providerStore.subscribe((state) => this.switchNetwork({rpcUrl: state.rpcTarget}))
  }

  initializeProvider (opts, providerContructor = MetaMaskProvider) {
    this._providerInit = opts
    this._provider = providerContructor(opts)
    this._proxy = createEventEmitterProxy(this._provider)
    this._proxy._blockTracker = createEventEmitterProxy(this._provider._blockTracker)
    this._proxy.on('block', this._logBlock.bind(this))
    this._proxy.on('error', this.verifyNetwork.bind(this))
    this.ethQuery = new EthQuery(this._proxy)
    this.lookupNetwork()
    return this._proxy
  }

  switchNetwork (providerInit) {
    this.setNetworkState('loading')
    const newInit = extend(this._providerInit, providerInit)
    this._providerInit = newInit

    this._proxy.removeAllListeners()
    this._proxy.stop()
    this._provider = MetaMaskProvider(newInit)
    // apply the listners created by other controllers
    const blockTrackerHandlers = this._proxy._blockTracker.proxyEventHandlers
    this._proxy.setTarget(this._provider)
    this._proxy._blockTracker = createEventEmitterProxy(this._provider._blockTracker, blockTrackerHandlers)
    this.emit('networkDidChange')
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
