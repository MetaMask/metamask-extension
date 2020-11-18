import assert from 'assert'
import EventEmitter from 'events'
import ObservableStore from 'obs-store'
import ComposedStore from 'obs-store/lib/composed'
import JsonRpcEngine from 'json-rpc-engine'
import providerFromEngine from 'eth-json-rpc-middleware/providerFromEngine'
import log from 'loglevel'
import {
  createSwappableProxy,
  createEventEmitterProxy,
} from 'swappable-obj-proxy'
import EthQuery from 'eth-query'
import createMetamaskMiddleware from './createMetamaskMiddleware'
import createInfuraClient from './createInfuraClient'
import createJsonRpcClient from './createJsonRpcClient'

import {
  RINKEBY,
  MAINNET,
  INFURA_PROVIDER_TYPES,
  NETWORK_TYPE_TO_ID_MAP,
} from './enums'

const env = process.env.METAMASK_ENV

let defaultProviderConfigOpts
if (process.env.IN_TEST === 'true') {
  defaultProviderConfigOpts = {
    type: 'rpc',
    rpcUrl: 'http://localhost:8545',
    chainId: '0x539',
    nickname: 'Localhost 8545',
  }
} else if (process.env.METAMASK_DEBUG || env === 'test') {
  defaultProviderConfigOpts = { type: RINKEBY }
} else {
  defaultProviderConfigOpts = { type: MAINNET }
}

const defaultProviderConfig = {
  ticker: 'ETH',
  ...defaultProviderConfigOpts,
}

export default class NetworkController extends EventEmitter {
  constructor(opts = {}) {
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

    // provider and block tracker
    this._provider = null
    this._blockTracker = null

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
  setInfuraProjectId(projectId) {
    if (!projectId || typeof projectId !== 'string') {
      throw new Error('Invalid Infura project ID')
    }

    this._infuraProjectId = projectId
  }

  initializeProvider(providerParams) {
    this._baseProviderParams = providerParams
    const { type, rpcUrl, chainId } = this.getProviderConfig()
    this._configureProvider({ type, rpcUrl, chainId })
    this.lookupNetwork()
  }

  // return the proxies so the references will always be good
  getProviderAndBlockTracker() {
    const provider = this._providerProxy
    const blockTracker = this._blockTrackerProxy
    return { provider, blockTracker }
  }

  verifyNetwork() {
    // Check network when restoring connectivity:
    if (this.isNetworkLoading()) {
      this.lookupNetwork()
    }
  }

  getNetworkState() {
    return this.networkStore.getState()
  }

  setNetworkState(network) {
    this.networkStore.putState(network)
  }

  isNetworkLoading() {
    return this.getNetworkState() === 'loading'
  }

  lookupNetwork() {
    // Prevent firing when provider is not defined.
    if (!this._provider) {
      log.warn(
        'NetworkController - lookupNetwork aborted due to missing provider',
      )
      return
    }

    const chainId = this.getCurrentChainId()
    if (!chainId) {
      log.warn(
        'NetworkController - lookupNetwork aborted due to missing chainId',
      )
      this.setNetworkState('loading')
      return
    }

    // Ping the RPC endpoint so we can confirm that it works
    const ethQuery = new EthQuery(this._provider)
    const initialNetwork = this.getNetworkState()
    ethQuery.sendAsync({ method: 'net_version' }, (err, networkVersion) => {
      const currentNetwork = this.getNetworkState()
      if (initialNetwork === currentNetwork) {
        if (err) {
          this.setNetworkState('loading')
          return
        }

        this.setNetworkState(networkVersion)
      }
    })
  }

  getCurrentChainId() {
    const { type, chainId: configChainId } = this.getProviderConfig()
    return NETWORK_TYPE_TO_ID_MAP[type]?.chainId || configChainId
  }

  setRpcTarget(rpcUrl, chainId, ticker = 'ETH', nickname = '', rpcPrefs) {
    this.setProviderConfig({
      type: 'rpc',
      rpcUrl,
      chainId,
      ticker,
      nickname,
      rpcPrefs,
    })
  }

  async setProviderType(type, rpcUrl = '', ticker = 'ETH', nickname = '') {
    assert.notEqual(
      type,
      'rpc',
      `NetworkController - cannot call "setProviderType" with type 'rpc'. use "setRpcTarget"`,
    )
    assert(
      INFURA_PROVIDER_TYPES.includes(type),
      `NetworkController - Unknown rpc type "${type}"`,
    )
    const { chainId } = NETWORK_TYPE_TO_ID_MAP[type]
    this.setProviderConfig({ type, rpcUrl, chainId, ticker, nickname })
  }

  resetConnection() {
    this.setProviderConfig(this.getProviderConfig())
  }

  /**
   * Sets the provider config and switches the network.
   */
  setProviderConfig(config) {
    this.providerStore.updateState(config)
    this._switchNetwork(config)
  }

  getProviderConfig() {
    return this.providerStore.getState()
  }

  //
  // Private
  //

  _switchNetwork(opts) {
    this.setNetworkState('loading')
    this._configureProvider(opts)
    this.emit('networkDidChange', opts.type)
  }

  _configureProvider({ type, rpcUrl, chainId }) {
    // infura type-based endpoints
    const isInfura = INFURA_PROVIDER_TYPES.includes(type)
    if (isInfura) {
      this._configureInfuraProvider(type, this._infuraProjectId)
      // url-based rpc endpoints
    } else if (type === 'rpc') {
      this._configureStandardProvider(rpcUrl, chainId)
    } else {
      throw new Error(
        `NetworkController - _configureProvider - unknown type "${type}"`,
      )
    }
  }

  _configureInfuraProvider(type, projectId) {
    log.info('NetworkController - configureInfuraProvider', type)
    const networkClient = createInfuraClient({
      network: type,
      projectId,
    })
    this._setNetworkClient(networkClient)
  }

  _configureStandardProvider(rpcUrl, chainId) {
    log.info('NetworkController - configureStandardProvider', rpcUrl)
    const networkClient = createJsonRpcClient({ rpcUrl, chainId })
    this._setNetworkClient(networkClient)
  }

  _setNetworkClient({ networkMiddleware, blockTracker }) {
    const metamaskMiddleware = createMetamaskMiddleware(
      this._baseProviderParams,
    )
    const engine = new JsonRpcEngine()
    engine.push(metamaskMiddleware)
    engine.push(networkMiddleware)
    const provider = providerFromEngine(engine)
    this._setProviderAndBlockTracker({ provider, blockTracker })
  }

  _setProviderAndBlockTracker({ provider, blockTracker }) {
    // update or intialize proxies
    if (this._providerProxy) {
      this._providerProxy.setTarget(provider)
    } else {
      this._providerProxy = createSwappableProxy(provider)
    }
    if (this._blockTrackerProxy) {
      this._blockTrackerProxy.setTarget(blockTracker)
    } else {
      this._blockTrackerProxy = createEventEmitterProxy(blockTracker, {
        eventFilter: 'skipInternal',
      })
    }
    // set new provider and blockTracker
    this._provider = provider
    this._blockTracker = blockTracker
  }
}
