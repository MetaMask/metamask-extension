const assert = require('assert')
const EventEmitter = require('events')
const createMetamaskProvider = require('web3-provider-engine/zero.js')
const ObservableStore = require('obs-store')
const ComposedStore = require('obs-store/lib/composed')
const extend = require('xtend')
const EthQuery = require('eth-query')
const createEthRpcClient = require('eth-rpc-client')
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
    this.providerProxy = createEventEmitterProxy()
    this.blockTrackerProxy = createEventEmitterProxy()

    this.on('networkDidChange', this.lookupNetwork)
  }

  initializeProvider (_providerParams) {
    this._baseProviderParams = _providerParams
    const rpcUrl = this.getCurrentRpcAddress()
    this._configureStandardClient({ rpcUrl })
    this.providerProxy.on('block', this._logBlock.bind(this))
    this.providerProxy.on('error', this.verifyNetwork.bind(this))
    this.ethQuery = new EthQuery(this.providerProxy)
    this.lookupNetwork()
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
    this._switchNetwork({ rpcUrl })
  }

  getCurrentRpcAddress () {
    const provider = this.getProviderConfig()
    if (!provider) return null
    return this.getRpcAddressForType(provider.type)
  }

  async setProviderType (type) {
    assert(type !== 'rpc', `NetworkController.setProviderType - cannot connect by type "rpc"`)
    // skip if type already matches
    if (type === this.getProviderConfig().type) return
    // lookup rpcTarget for type
    const rpcTarget = this.getRpcAddressForType(type)
    assert(rpcTarget, `NetworkController - unknown rpc address for type "${type}"`)
    // update connection
    this.providerStore.updateState({ type, rpcTarget })
    this._switchNetwork({ rpcUrl: rpcTarget })
  }

  getProviderConfig () {
    return this.providerStore.getState()
  }

  getRpcAddressForType (type, provider = this.getProviderConfig()) {
    if (RPC_ADDRESS_LIST[type]) return RPC_ADDRESS_LIST[type]
    return provider && provider.rpcTarget ? provider.rpcTarget : DEFAULT_RPC
  }

  //
  // Private
  //

  _switchNetwork (providerParams) {
    this.setNetworkState('loading')
    this._configureStandardClient(providerParams)
    this.emit('networkDidChange')
  }

  _configureStandardClient(_providerParams) {
    const providerParams = extend(this._baseProviderParams, _providerParams)
    const client = createEthRpcClient(providerParams)
    this._setClient(client)
  }

  _createMetamaskProvider(providerParams) {
    const { provider, blockTracker } = createEthRpcClient(providerParams)
  }

  _setClient (newClient) {
    // teardown old client
    const oldClient = this._currentClient
    if (oldClient) {
      oldClient.blockTracker.stop()
      // asyncEventEmitter lacks a "removeAllListeners" method
      // oldClient.blockTracker.removeAllListeners
      oldClient.blockTracker._events = {}
    }
    // set as new provider
    this._currentClient = newClient
    this.providerProxy.setTarget(newClient.provider)
    this.blockTrackerProxy.setTarget(newClient.blockTracker)
  }

  _logBlock (block) {
    log.info(`BLOCK CHANGED: #${block.number.toString('hex')} 0x${block.hash.toString('hex')}`)
    this.verifyNetwork()
  }
}
