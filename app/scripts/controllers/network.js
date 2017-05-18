const EventEmitter = require('events')
const MetaMaskProvider = require('web3-provider-engine/zero.js')
const ObservableStore = require('obs-store')
const extend = require('xtend')
const EthQuery = require('eth-query')
const MetamaskConfig = require('../config.js')

const TESTNET_RPC = MetamaskConfig.network.testnet
const MAINNET_RPC = MetamaskConfig.network.mainnet
const MORDEN_RPC = MetamaskConfig.network.morden
const KOVAN_RPC = MetamaskConfig.network.kovan
const RINKEBY_RPC = MetamaskConfig.network.rinkeby

module.exports = class NetworkController extends EventEmitter {
  constructor (providerOpts) {
    super()
    this.networkStore = new ObservableStore({ network: 'loading' })
    providerOpts.provider.rpcTarget = this.getRpcAddressForType(providerOpts.provider.type)
    this.providerStore = new ObservableStore(providerOpts)
    this._claimed = 0
  }

  getState () {
    return extend({},
      this.networkStore.getState(),
      this.providerStore.getState()
    )
  }

  initializeProvider (opts) {
    this.providerConfig = opts
    this.provider = MetaMaskProvider(opts)
    this.ethQuery = new EthQuery(this.provider)
    this.lookupNetwork()
    return Promise.resolve(this.provider)
  }
  switchNetwork (providerConfig) {
    delete this.provider
    delete this.ethQuery
    const newConfig = extend(this.providerConfig, providerConfig)
    this.providerConfig = newConfig
    this.provider = MetaMaskProvider(newConfig)
    this.ethQuery = new EthQuery(this.provider)
    this.emit('networkSwitch', {
      provider: this.provider,
      ethQuery: this.ethQuery,
    }, this.claim.bind(this))
  }

  subscribe (cb) {
    this.networkStore.subscribe(cb)
    this.providerStore.subscribe(cb)
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
    this.once('claimed', () => {
      this.providerStore.updateState({provider: {type, rpcTarget}})
      console.log('CLAIMED')
      this.lookupNetwork()
    })

  }

  useEtherscanProvider () {
    this.setProviderType('etherscan')
  }

  getProvider () {
    return this.providerStore.getState().provider
  }

  getRpcAddressForType (type) {
    switch (type) {

      case 'mainnet':
        return MAINNET_RPC

      case 'testnet':
        return TESTNET_RPC

      case 'morden':
        return MORDEN_RPC

      case 'kovan':
        return KOVAN_RPC

      case 'rinkeby':
        return RINKEBY_RPC

      default:
        return provider && provider.rpcTarget ? provider.rpcTarget : TESTNET_RPC
    }
  }

  claim () {
    this._claimed += 1
    if (this._claimed === this.listenerCount('networkSwitch')) {
      this.emit('claimed')
      this._claimed = 0
    }
  }
}
