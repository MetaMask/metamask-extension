const assert = require('assert')
const EventEmitter = require('events')
const ObservableStore = require('obs-store')
const ComposedStore = require('obs-store/lib/composed')
const EthQuery = require('eth-query')
const JsonRpcEngine = require('json-rpc-engine')
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine')
const log = require('loglevel')
const createMetamaskMiddleware = require('./createMetamaskMiddleware')
const createInfuraClient = require('./createInfuraClient')
const createJsonRpcClient = require('./createJsonRpcClient')
const createLocalhostClient = require('./createLocalhostClient')
//const createPocketClient = require('./createPocketClient')
const { createSwappableProxy, createEventEmitterProxy } = require('swappable-obj-proxy')
const ethNetProps = require('eth-net-props')
const parse = require('url-parse')

const {
  ROPSTEN,
  RINKEBY,
  KOVAN,
  MAINNET,
  LOCALHOST,
  POA_SOKOL,
  POA,
  DAI,
  GOERLI_TESTNET,
  CLASSIC,
  RSK,
  RSK_TESTNET,
  POA_CODE,
  DAI_CODE,
  POA_SOKOL_CODE,
  GOERLI_TESTNET_CODE,
  CLASSIC_CODE,
  RSK_CODE,
  RSK_TESTNET_CODE,
} = require('./enums')
const INFURA_PROVIDER_TYPES = [ROPSTEN, RINKEBY, KOVAN, MAINNET]

const env = process.env.METAMASK_ENV
const METAMASK_DEBUG = process.env.METAMASK_DEBUG
const testMode = (METAMASK_DEBUG || env === 'test')

const defaultProviderConfig = {
  type: testMode ? POA_SOKOL : POA,
}

module.exports = class NetworkController extends EventEmitter {

  constructor (opts = {}) {
    super()

    // parse options
    const providerConfig = opts.provider || defaultProviderConfig
    // create stores
    this.providerStore = new ObservableStore(providerConfig)
    this.networkStore = new ObservableStore('loading')
    this.store = new ComposedStore({ provider: this.providerStore, network: this.networkStore, dProvider: false })
    this.on('networkDidChange', this.lookupNetwork)
    // provider and block tracker
    this._provider = null
    this._blockTracker = null
    // provider and block tracker proxies - because the network changes
    this._providerProxy = null
    this._blockTrackerProxy = null
  }

  initializeProvider (providerParams) {
    this._baseProviderParams = providerParams
    const { type, rpcTarget } = this.providerStore.getState()
    this._configureProvider({ type, rpcTarget })
    this.lookupNetwork()
  }

  // return the proxies so the references will always be good
  getProviderAndBlockTracker () {
    const provider = this._providerProxy
    const blockTracker = this._blockTrackerProxy
    return { provider, blockTracker }
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
    const { type, rpcTarget } = this.providerStore.getState()
    // Prevent firing when provider is not defined.
    if (!this._provider) {
      return log.warn('NetworkController - lookupNetwork aborted due to missing provider')
    }
    const ethQuery = new EthQuery(this._provider)
    ethQuery.sendAsync({ method: 'net_version' }, (err, network) => {
      if (err) return this.setNetworkState('loading')
      const targetHost = parse(rpcTarget, true).host
      const classicHost = parse(ethNetProps.RPCEndpoints(CLASSIC_CODE)[0], true).host
      if (type === CLASSIC || targetHost === classicHost) {
        network = CLASSIC_CODE.toString()
      } // workaround to avoid Mainnet and Classic are having the same network ID
      log.info('web3.getNetwork returned ' + network)
      this.setNetworkState(network)
    })
  }

  setRpcTarget (rpcTarget) {
    const providerConfig = {
      type: 'rpc',
      rpcTarget,
    }
    this.providerConfig = providerConfig
  }

  async setProviderType (type) {
    assert.notEqual(type, 'rpc', `NetworkController - cannot call "setProviderType" with type 'rpc'. use "setRpcTarget"`)
    assert(INFURA_PROVIDER_TYPES.includes(type) ||
      type === LOCALHOST ||
      type === POA_SOKOL ||
      type === POA ||
      type === DAI ||
      type === GOERLI_TESTNET ||
      type === CLASSIC ||
      type === RSK ||
      type === RSK_TESTNET
      , `NetworkController - Unknown rpc type "${type}"`)
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

  getDProvider(){
    return this.store.getState().dProvider
  }

  setDProvider(key){
    this.store.updateState({
      dProvider: key
    })
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
    const { type, rpcTarget } = opts
    // infura type-based endpoints
    const isInfura = INFURA_PROVIDER_TYPES.includes(type)
    if (isInfura) {
      if (this.store.dProvider) {
       // log.debug("IS POCKET")
        this._configurePocketProvider(opts)
      } else {
        // log.debug("IS INFURA")
        this._configureInfuraProvider(opts)
      }
    // other type-based rpc endpoints
    } else if (type === POA) {
      this._configureStandardProvider({ rpcUrl: ethNetProps.RPCEndpoints(POA_CODE)[0] })
    } else if (type === DAI) {
      this._configureStandardProvider({ rpcUrl: ethNetProps.RPCEndpoints(DAI_CODE)[0] })
    } else if (type === POA_SOKOL) {
      this._configureStandardProvider({ rpcUrl: ethNetProps.RPCEndpoints(POA_SOKOL_CODE)[0] })
    } else if (type === GOERLI_TESTNET) {
      this._configureStandardProvider({ rpcUrl: ethNetProps.RPCEndpoints(GOERLI_TESTNET_CODE)[0] })
    } else if (type === CLASSIC) {
      this._configureStandardProvider({ rpcUrl: ethNetProps.RPCEndpoints(CLASSIC_CODE)[0] })
    } else if (type === RSK) {
      this._configureStandardProvider({ rpcUrl: ethNetProps.RPCEndpoints(RSK_CODE)[0] })
    } else if (type === RSK_TESTNET) {
      this._configureStandardProvider({ rpcUrl: ethNetProps.RPCEndpoints(RSK_TESTNET_CODE)[0] })
    } else if (type === LOCALHOST) {
      this._configureLocalhostProvider()
    // url-based rpc endpoints
    } else if (type === 'rpc') {
      this._configureStandardProvider({ rpcUrl: rpcTarget })
    } else {
      throw new Error(`NetworkController - _configureProvider - unknown type "${type}"`)
    }
  }

  _configureInfuraProvider ({ type }) {
    log.info('NetworkController - configureInfuraProvider', type)
    const networkClient = createInfuraClient({ network: type })
    this._setNetworkClient(networkClient)
  }

  _configurePocketProvider ({ type }) {
    log.info('NetworkController - configurePocketProvider', type)
    //const networkClient = createPocketClient({ network: type })
    const networkClient = createInfuraClient({ network: type })
    this._setNetworkClient(networkClient)
    // setup networkConfig
    var settings = {
      ticker: 'ETH',
    }
    this.networkConfig.putState(settings)
  }

  _configureLocalhostProvider () {
    log.info('NetworkController - configureLocalhostProvider')
    const networkClient = createLocalhostClient()
    this._setNetworkClient(networkClient)
  }

  _configureStandardProvider ({ rpcUrl }) {
    log.info('NetworkController - configureStandardProvider', rpcUrl)
    const networkClient = createJsonRpcClient({ rpcUrl })
    this._setNetworkClient(networkClient)
  }

  _setNetworkClient ({ networkMiddleware, blockTracker }) {
    const metamaskMiddleware = createMetamaskMiddleware(this._baseProviderParams)
    const engine = new JsonRpcEngine()
    engine.push(metamaskMiddleware)
    engine.push(networkMiddleware)
    const provider = providerFromEngine(engine)
    this._setProviderAndBlockTracker({ provider, blockTracker })
  }

  _setProviderAndBlockTracker ({ provider, blockTracker }) {
    // update or intialize proxies
    if (this._providerProxy) {
      this._providerProxy.setTarget(provider)
    } else {
      this._providerProxy = createSwappableProxy(provider)
    }
    if (this._blockTrackerProxy) {
      this._blockTrackerProxy.setTarget(blockTracker)
    } else {
      this._blockTrackerProxy = createEventEmitterProxy(blockTracker, { eventFilter: 'skipInternal' })
    }
    // set new provider and blockTracker
    this._provider = provider
    this._blockTracker = blockTracker
  }

  _logBlock (block) {
    log.info(`BLOCK CHANGED: #${block.number.toString('hex')} 0x${block.hash.toString('hex')}`)
    this.verifyNetwork()
  }
}
