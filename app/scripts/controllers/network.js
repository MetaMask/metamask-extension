const EventEmitter = require('events')
const MetaMaskProvider = require('web3-provider-engine/zero.js')
const ObservableStore = require('obs-store')
const extend = require('xtend')
const EthQuery = require('eth-query')
const RPC_ADDRESS_LIST = require('../config.js').network

module.exports = class NetworkController extends EventEmitter {
  constructor (providerOpts) {
    super()
    this.networkStore = new ObservableStore({ network: 'loading' })
    providerOpts.provider.rpcTarget = this.getRpcAddressForType(providerOpts.provider.type, providerOpts.provider)
    this.providerStore = new ObservableStore(providerOpts)
    this.store = new ObservableStore(extend(this.networkStore.getState(), this.providerStore.getState()))

    this._providerListners = {}

    this.networkStore.subscribe((state) => this.store.updateState(state))
    this.providerStore.subscribe((state) => this.store.updateState(state))
    this.on('networkSwitch', this.lookupNetwork)
  }

  get provider () {
    return this._proxy
  }

  set provider (provider) {
    this._provider = provider
  }

  getState () {
    return extend({},
      this.networkStore.getState(),
      this.providerStore.getState()
    )
  }

  initializeProvider (opts) {
    this.providerConfig = opts
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

  switchNetwork (providerConfig) {
    const newConfig = extend(this.providerConfig, providerConfig)
    this.providerConfig = newConfig

    this.provider = MetaMaskProvider(newConfig)
    // apply the listners created by other controllers
    Object.keys(this._providerListners).forEach((key) => {
      this._providerListners[key].forEach((handler) => this._provider.addListener(key, handler))
    })
    this.emit('networkSwitch', this.provider)
  }


  verifyNetwork () {
  // Check network when restoring connectivity:
    if (this.isNetworkLoading()) this.lookupNetwork()
  }

  getNetworkState () {
    return this.networkStore.getState().network
  }

  setNetworkState (network) {
    return this.networkStore.updateState({ network })
  }

  isNetworkLoading () {
    return this.getNetworkState() === 'loading'
  }

  lookupNetwork (err) {
    if (err) this.setNetworkState('loading')

    this.ethQuery.sendAsync({ method: 'net_version' }, (err, network) => {
      if (err) return this.setNetworkState('loading')
      log.info('web3.getNetwork returned ' + network)
      this.setNetworkState(network)
    })
  }

  setRpcTarget (rpcUrl) {
    this.providerStore.updateState({
      provider: {
        type: 'rpc',
        rpcTarget: rpcUrl,
      },
    })
  }

  getCurrentRpcAddress () {
    var provider = this.getProvider()
    if (!provider) return null
    return this.getRpcAddressForType(provider.type)
  }

  setProviderType (type) {
    if (type === this.getProvider().type) return
    const rpcTarget = this.getRpcAddressForType(type)
    this.networkStore.updateState({network: 'loading'})
    this.switchNetwork({
      rpcUrl: rpcTarget,
    })
    this.providerStore.updateState({provider: {type, rpcTarget}})
  }

  getProvider () {
    return this.providerStore.getState().provider
  }

  getRpcAddressForType (type, provider = this.getProvider()) {
    console.log(`#getRpcAddressForType: ${type}`)
    if (type in RPC_ADDRESS_LIST) return RPC_ADDRESS_LIST[type]
    return provider && provider.rpcTarget ? provider.rpcTarget : RPC_ADDRESS_LIST['rinkeby']
  }

  _logBlock (block) {
    log.info(`BLOCK CHANGED: #${block.number.toString('hex')} 0x${block.hash.toString('hex')}`)
    this.verifyNetwork()
  }

  _on (event, handler) {
    if (!this._providerListners[event]) this._providerListners[event] = []
    this._providerListners[event].push(handler)
    this._provider.on(event, handler)
  }
}
