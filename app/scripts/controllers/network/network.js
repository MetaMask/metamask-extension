const ObservableStore = require('obs-store')
const EthQuery = require('eth-query')
const JsonRpcEngine = require('json-rpc-engine')
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine')
const log = require('loglevel')
const createMetamaskMiddleware = require('./createMetamaskMiddleware')
const createInfuraClient = require('./createInfuraClient')
const createJsonRpcClient = require('./createJsonRpcClient')
const createLocalhostClient = require('./createLocalhostClient')
const util = require('./util')
const { LOCALHOST, CUSTOM_RPC } = require('./enums')

module.exports = class Network {
  // opts = {type, chainId, rpcUrl}
  constructor (opts) {
    // parse options
    this.providerConfig = opts
    this.type = opts.type
    if (opts.rpcUrl) this.rpcUrl = opts.rpcUrl
    if (opts.chainId) this.chainId = opts.chainId
    this.networkStore = new ObservableStore('loading')
    this.ready = new Promise((resolve, reject) => {
      this._ready = resolve
      this._failed = reject
    })
    if (opts.initialize) {
      this.initializeProvider(opts.baseOpts)
    }
  }

  async initializeProvider (providerParams) {
    try {
      this._baseProviderParams = providerParams

      const { provider, blockTracker } = this._configureProvider(this.providerConfig)

      this.provider = provider
      this.blockTracker = blockTracker
      this.initialized = true
      this._ready({ provider, blockTracker })
      this.lookupNetwork()
    } catch (e) {
      this._setfaliureState(e)
    }
  }

  getProviderConfig () {
    return this.providerConfig
  }

  verifyNetwork () {
    // Check network when restoring connectivity:
    if (this.isNetworkLoading()) this.lookupNetwork()
  }

  setNetworkState (netId) {
    let chainId
    // if this is a custom rpc use the custom chain ID
    if (this.type === CUSTOM_RPC) chainId = this.chainId
    // if no chain id use the netId
    return this.networkStore.putState(chainId || netId)
  }

  getNetworkState () {
    return this.networkStore.getState()
  }

  getNetworkConfig () {
    return this.networkConfig.getState()
  }

  isNetworkLoading () {
    return this.getNetworkState() === 'loading'
  }

  lookupNetwork () {
    // Prevent firing when provider is not defined.
    if (!this._provider) {
      return log.warn('NetworkController - lookupNetwork aborted due to missing provider')
    }
    if (this.getNetworkState() !== 'loading') return
    const { type } = this.providerConfig
    const ethQuery = new EthQuery(this._provider)
    const initialNetwork = this.getNetworkState()
    ethQuery.sendAsync({ method: 'net_version' }, (err, network) => {
      const currentNetwork = this.getNetworkState()
      if (initialNetwork === currentNetwork) {
        if (err) {
          return this.setNetworkState('loading')
        }
        log.info('web3.getNetwork returned ' + network)
        this.setNetworkState(network, type)
      }
    })
  }

  stop () {

  }

  //
  // Private
  //

  _setfaliureState (reason) {
    if (!this.failed) {
      this.failed = true
      this.error = reason
      this._failed(reason)
    }
  }

  _configureProvider (opts) {
    // infura type-based endpoints
    const isInfura = util.isInfura(opts.type)

    if (isInfura) {
      return this._configureInfuraProvider(opts)
    // other type-based rpc endpoints
    } else if (opts.type === LOCALHOST) {
      return this._configureLocalhostProvider()
    // url-based rpc endpoints
    } else if (opts.type === CUSTOM_RPC) {
      return this._configureStandardProvider(opts)
    } else {
      throw new Error(`NetworkController - _configureProvider - unknown type "${opts.type}"`)
    }
  }

  _configureInfuraProvider ({ type }) {
    log.info('NetworkController - configureInfuraProvider', type)
    const networkClient = createInfuraClient({ network: type })
    return this._addMetaMaskMiddleware(networkClient)
  }

  _configureLocalhostProvider () {
    log.info('NetworkController - configureLocalhostProvider')
    const networkClient = createLocalhostClient()
    return this._addMetaMaskMiddleware(networkClient)
  }

  _configureStandardProvider ({ rpcUrl }) {
    log.info('NetworkController - configureStandardProvider', rpcUrl)
    const networkClient = createJsonRpcClient({ rpcUrl })
    // setup networkConfig
    return this._addMetaMaskMiddleware(networkClient)
  }

  _addMetaMaskMiddleware ({ networkMiddleware, blockTracker }) {
    const metamaskMiddleware = createMetamaskMiddleware(this._baseProviderParams)
    const engine = new JsonRpcEngine()
    engine.push(metamaskMiddleware)
    engine.push(networkMiddleware)
    const provider = providerFromEngine(engine)
    return { provider, blockTracker }
  }

  _logBlock (block) {
    log.info(`BLOCK CHANGED: #${block.number.toString('hex')} 0x${block.hash.toString('hex')}`)
    this.verifyNetwork()
  }
}
