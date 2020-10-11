import assert from 'assert'
import EventEmitter from 'events'
import ObservableStore from 'obs-store'
import ComposedStore from 'obs-store/lib/composed'
import JsonRpcEngine from 'json-rpc-engine'
import providerFromEngine from 'eth-json-rpc-middleware/providerFromEngine'
import log from 'loglevel'
import { createSwappableProxy, createEventEmitterProxy } from 'swappable-obj-proxy'
import EthQuery from 'eth-query'
import createMetamaskMiddleware from './createMetamaskMiddleware'
import createInfuraClient from './createInfuraClient'
import createJsonRpcClient from './createJsonRpcClient'
import createLocalhostClient from './createLocalhostClient'

import {
  RINKEBY,
  MAINNET,
  LOCALHOST,
  INFURA_PROVIDER_TYPES,
  NETWORK_TYPE_TO_ID_MAP,
} from './enums'

const env = process.env.METAMASK_ENV

let defaultProviderConfigType
let defaultProviderChainId
if (process.env.IN_TEST === 'true') {
  defaultProviderConfigType = LOCALHOST
  // Decimal 5777, an arbitrary chain ID we use for testing
  defaultProviderChainId = '0x1691'
} else if (process.env.METAMASK_DEBUG || env === 'test') {
  defaultProviderConfigType = RINKEBY
} else {
  defaultProviderConfigType = MAINNET
}

const defaultProviderConfig = {
  type: defaultProviderConfigType,
  ticker: 'ETH',
}
if (defaultProviderChainId) {
  defaultProviderConfig.chainId = defaultProviderChainId
}

export default class NetworkController extends EventEmitter {

  constructor (opts = {}) {
    super()

    // create stores
    this.providerStore = new ObservableStore(
      opts.provider || { ...defaultProviderConfig },
    )
    this.networkStore = new ObservableStore('loading')
    this.store = new ComposedStore({
      provider: this.providerStore,
      network: this.networkStore,
    })

    // provider, block tracker, and EthQuery
    this._provider = null
    this._blockTracker = null
    this._query = null

    // provider and block tracker proxies - because the network changes
    this._providerProxy = null
    this._blockTrackerProxy = null

    this.on('networkDidChange', this.lookupNetwork)
  }

  /**
   * Sets the Infura project ID
   *
   * @param {string} projectId - The Infura project ID
   * @throws {Error} if the project ID is not a valid string
   * @return {void}
   */
  setInfuraProjectId (projectId) {
    if (!projectId || typeof projectId !== 'string') {
      throw new Error('Invalid Infura project ID')
    }

    this._infuraProjectId = projectId
  }

  initializeProvider (providerParams) {
    this._baseProviderParams = providerParams
    const { type, rpcUrl, chainId } = this.getProviderConfig()
    this._configureProvider({ type, rpcUrl, chainId })
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
    if (this.isNetworkLoading()) {
      this.lookupNetwork()
    }
  }

  getNetworkState () {
    return this.networkStore.getState()
  }

  setNetworkState (network) {
    this.networkStore.putState(network)
  }

  isNetworkLoading () {
    return this.getNetworkState() === 'loading'
  }

  async lookupNetwork () {
    // Prevent firing when provider is not defined.
    if (!this._provider) {
      log.warn('NetworkController - lookupNetwork aborted due to missing provider')
      return
    }

    const initialNetwork = this.getNetworkState()
    let currentNetwork

    const { type } = this.getProviderConfig()
    const chainId = await this.getCurrentChainId()

    currentNetwork = this.getNetworkState()
    if (initialNetwork !== currentNetwork) {
      return
    }

    if (!chainId) {
      log.warn('NetworkController - lookupNetwork aborted due to missing chainId')
      this.setNetworkState('loading')
      return
    }

    // The net_version call performs two functions:
    // 1. Ping the endpoint to confirm that it works, otherwise set the network
    //    state to 'loading'. Our UI doesn't handle unresponsive endpoints well.
    // 2. Get the network ID/version so that we can use it to set the network
    //    state, which we do for legacy reasons.
    this._query.sendAsync({ method: 'net_version' }, (err, networkVersion) => {
      currentNetwork = this.getNetworkState()
      if (initialNetwork === currentNetwork) {
        if (err) {
          this.setNetworkState('loading')
          return
        }

        this.setNetworkState((
          type === 'rpc'
            ? chainId
            : networkVersion
        ))
      }
    })
  }

  /**
   * Gets the chain ID for the current network. Calls 'eth_chainId' for
   * providers of type LOCALHOST, and retrieves the ID from constants or the
   * provider config otherwise.
   *
   * @returns {Promise<string>} The chain ID for the current network.
   */
  async getCurrentChainId () {
    const { type, chainId: configChainId } = this.getProviderConfig()
    if (type !== LOCALHOST) {
      return NETWORK_TYPE_TO_ID_MAP[type]?.chainId || configChainId
    }

    return new Promise((resolve) => {
      const initialNetwork = this.getNetworkState()
      this._query.sendAsync({ method: 'eth_chainId' }, (err, chainId) => {
        const currentNetwork = this.getNetworkState()
        if (initialNetwork !== currentNetwork) {
          return resolve(null)
        }

        if (err) {
          log.warn(err)
          return resolve(null)
        }
        return resolve(chainId || null)
      })
    })
  }

  setRpcTarget (rpcUrl, chainId, ticker = 'ETH', nickname = '', rpcPrefs) {
    this.setProviderConfig({
      type: 'rpc',
      rpcUrl,
      chainId,
      ticker,
      nickname,
      rpcPrefs,
    })
  }

  async setProviderType (type, rpcUrl = '', ticker = 'ETH', nickname = '') {
    assert.notEqual(
      type, 'rpc',
      `NetworkController - cannot call "setProviderType" with type 'rpc'. use "setRpcTarget"`,
    )
    assert(
      INFURA_PROVIDER_TYPES.includes(type) || type === LOCALHOST,
      `NetworkController - Unknown rpc type "${type}"`,
    )

    const chainId = type === LOCALHOST
      ? null
      : NETWORK_TYPE_TO_ID_MAP[type].chainId

    this.setProviderConfig({ type, rpcUrl, chainId, ticker, nickname })
  }

  resetConnection () {
    this.setProviderConfig(this.getProviderConfig())
  }

  /**
   * Sets the provider config and switches the network.
   */
  setProviderConfig (config) {
    this.providerStore.updateState(config)
    this._switchNetwork(config)
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
    this.emit('networkDidChange', opts.type)
  }

  _configureProvider ({ type, rpcUrl, chainId }) {
    // infura type-based endpoints
    const isInfura = INFURA_PROVIDER_TYPES.includes(type)
    if (isInfura) {
      this._configureInfuraProvider(type, this._infuraProjectId)
    // other type-based rpc endpoints
    } else if (type === LOCALHOST) {
      this._configureLocalhostProvider()
    // url-based rpc endpoints
    } else if (type === 'rpc') {
      this._configureStandardProvider(rpcUrl, chainId)
    } else {
      throw new Error(`NetworkController - _configureProvider - unknown type "${type}"`)
    }
  }

  _configureInfuraProvider (type, projectId) {
    log.info('NetworkController - configureInfuraProvider', type)
    const networkClient = createInfuraClient({
      network: type,
      projectId,
    })
    this._setNetworkClient(networkClient)
  }

  _configureLocalhostProvider () {
    log.info('NetworkController - configureLocalhostProvider')
    const networkClient = createLocalhostClient()
    this._setNetworkClient(networkClient)
  }

  _configureStandardProvider (rpcUrl, chainId) {
    log.info('NetworkController - configureStandardProvider', rpcUrl)
    const networkClient = createJsonRpcClient({ rpcUrl, chainId })
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
    // set new provider, blockTracker, and EthQuery
    this._provider = provider
    this._blockTracker = blockTracker
    this._query = new EthQuery(provider)
  }
}
