const EventEmitter = require('events')
const MetaMaskProvider = require('web3-provider-engine/zero.js')
const ObservableStore = require('obs-store')
const ComposedStore = require('obs-store/lib/composed')
const extend = require('xtend')
const EthQuery = require('eth-query')
const RPC_ADDRESS_LIST = require('../config.js').network
const DEFAULT_RPC = RPC_ADDRESS_LIST['rinkeby']

module.exports = class NetworkController extends EventEmitter {
  constructor (config) {
    super()
    this.networkStore = new ObservableStore('loading')
    config.provider.rpcTarget = this.getRpcAddressForType(config.provider.type, config.provider)
    this.providerStore = new ObservableStore(config.provider)
    this.store = new ComposedStore({ provider: this.providerStore, network: this.networkStore })
    this._providerListeners = {}

    this.on('networkDidChange', this.lookupNetwork)
    this.providerStore.subscribe((state) => this.switchNetwork({rpcUrl: state.rpcTarget}))
  }

  get provider () {
    return this._proxy
  }

  set provider (provider) {
    this._provider = provider
  }

  initializeProvider (opts) {
    this.providerInit = opts
    this._provider = MetaMaskProvider(opts)
    this._proxy = new Proxy(this._provider, {
      get: (obj, name) => {
        if (name === 'on') return this._on.bind(this)
        return this._provider[name]
      },
      set: (obj, name, value) => {
        this._provider[name] = value
      },
    })
    this.provider.on('block', this._logBlock.bind(this))
    this.provider.on('error', this.verifyNetwork.bind(this))
    this.ethQuery = new EthQuery(this.provider)
    this.lookupNetwork()
    return this.provider
  }

  switchNetwork (providerInit) {
    this.setNetworkState('loading')
    const newInit = extend(this.providerInit, providerInit)
    this.providerInit = newInit

    this._provider.removeAllListeners()
    this.provider = MetaMaskProvider(newInit)
    // apply the listners created by other controllers
    Object.keys(this._providerListeners).forEach((key) => {
      this._providerListeners[key].forEach((handler) => this._provider.addListener(key, handler))
    })
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

  _on (event, handler) {
    if (!this._providerListeners[event]) this._providerListeners[event] = []
    this._providerListeners[event].push(handler)
    this._provider.on(event, handler)
  }
}
