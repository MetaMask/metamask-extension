const EventEmitter = require('events')
const extend = require('xtend')
const ObservableStore = require('obs-store')
const Network = require('./network')
const { createSwappableProxy, createEventEmitterProxy } = require('swappable-obj-proxy')
const { isInfura } = require('./util')

const env = process.env.METAMASK_ENV
const METAMASK_DEBUG = process.env.METAMASK_DEBUG

const enums = require('./enums')

let defaultProviderConfigType
if (process.env.IN_TEST === 'true') {
  defaultProviderConfigType = enums.LOCALHOST
} else if (METAMASK_DEBUG || env === 'test') {
  defaultProviderConfigType = enums.RINKEBY
} else {
  defaultProviderConfigType = enums.MAINNET
}

const defaultNetwork = defaultProviderConfigType

module.exports = class NetworkController extends EventEmitter {
  constructor (opts = {}) {
    super()
    const {
      networkConfigs = enums.DEFAULT_LIST,
      selectedNetworkConfig = enums.DEFAULT_LIST.find((net) => net.type === defaultNetwork),
    } = opts
    this.store = new ObservableStore({
      networkConfigs,
      selectedNetworkConfig,
      provider: selectedNetworkConfig,
    })

    this.networkStore = new ObservableStore('loading')
    this.providerStore = new ObservableStore(selectedNetworkConfig)
    this.networkStore.subscribe((netId) => {
      if (netId === 'loading') return
      try {
        this.providerStore.putState(this.selectedNetworkConfig)
        this.providerStore.updateState({ provider: this.selectedNetworkConfig })
      } catch (e) {
        // what do i do here when log.error can blow up?
      }
    })


    this.networkConfigs = networkConfigs
    this.selectedNetworkConfig = selectedNetworkConfig

    // provider and block tracker
    this._provider = null
    this._blockTracker = null
    // provider and block tracker proxies - because the network changes
    this._providerProxy = createSwappableProxy({})
    const nullBlockTracker = new EventEmitter()
    nullBlockTracker.getCurrentBlock = () => null
    nullBlockTracker.getLatestBlock = () => null
    this._blockTrackerProxy = createEventEmitterProxy(nullBlockTracker, { eventFilter: 'skipInternal' })

  }

  getNetworkConfig () {
    return this.selectedNetworkConfig
  }

  lookupNetwork () {
    return this.selectedNetwork.networkStore.getState()
  }

  isNetworkLoading () {
    if (this.selectedNetwork) return this.selectedNetwork.networkStore.getState() === 'loading'
    else return true
  }

  initializeProvider (baseOpts) {
    if (this._initialized) return
    this._baseOpts = baseOpts
    this.networks = this.networkConfigs.reduce((networks, config) => {
      const key = config.type === enums.CUSTOM_RPC ? config.rpcUrl : config.type
      const opts = {
        baseOpts,
        rpcUrl: config.rpcUrl,
        type: config.type,
        chainId: config.custom.chainId,
      }

      if (isInfura(key)) {
        if (key === this.selectedNetworkConfig.type) opts.initialize = true
      } else {
        if (key === this.selectedNetworkConfig.rpcUrl) opts.initialize = true
      }





      // note to future self fix this




      networks[key] = new Network(opts)
      if (opts.initialize) {
        networks[key].ready.then(({ provider, blockTracker }) => {
          this._setProviderAndBlockTracker({ provider, blockTracker })
          this.setNetworkState(networks[key].getNetworkState())
        })
        this.selectedNetwork = networks[key]
      }
      return networks
    }, {})
    this._initialized = true
  }

  // return the selected network config

  getProviderConfig () {
    return this.selectedNetworkConfig
  }

  // return the proxies so the references will always be good
  getProviderAndBlockTracker () {
    const provider = this._providerProxy
    const blockTracker = this._blockTrackerProxy
    return { provider, blockTracker }
  }

  addNetwork (opts) {
    const config = {
      type: enums.CUSTOM_RPC,
      ...opts,
      custom: {ticker: 'ETH', ...opts.custom},
    }

    this.networkConfigs.push(config)
    this.networks[config.rpcUrl] = new Network({
      rpcUrl: config.rpcUrl,
      type: config.type,
      chainId: config.custom.chainId,
      baseOpts: this._baseOpts,
    })
  }

  removeNetwork (url) {
    // remove from config list
    this.networkConfigs = this.networkConfig.reduce((list, config) => {
      if (config.rpcUrl !== url) list.push(config)
      return list
    }, [])
    this.networks[url].stop()
    // stop and remove from network list
    delete this.networks[url]
  }

  setProviderType (type) {
    this.setNetworkState('loading')
    const network = this.networks[type]
    if (!network) throw new Error('NetworkController - network does not exist')
    const { provider, blockTracker } = network
    if (!network.initialized) {
      network.initializeProvider(this._baseOpts)
      network.ready.then(({provider, blockTracker}) => {
        this._setProviderAndBlockTracker({ provider, blockTracker })
        this.setNetworkState(network.getNetworkState())
      })
    } else {
      this._setProviderAndBlockTracker({ provider, blockTracker })
      this.setNetworkState(network.getNetworkState())

    }
    this.selectedNetwork = network
    this.selectedNetworkConfig = network.providerConfig
  }

  setNetworkState (netId) {
    return this.networkStore.putState(netId)
  }

  getNetworkState () {
    return this.networkStore.getState()
  }


  async setNetwork ({rpcUrl, type}) {
    const network = this.networks.find((network) => {
      if (rpcUrl) {
        return network.providerConfig.rpcUrl === rpcUrl
      } else {
        return network.providerConfig.type === type
      }
    }) || {}
    const { provider, blockTracker } = network
    if (!network.initialized) {
      network.initializeProvider(this._baseOpts)
      network.ready.then(({provider, blockTracker}) => {
        this._setProviderAndBlockTracker({ provider, blockTracker })
      })
    } else {
      this._setProviderAndBlockTracker({ provider, blockTracker })
    }
    this.selectedNetwork = network
    this.selectedNetworkConfig = network.providerConfig
  }


  /**
   * updates custom RPC details
   *
   * @param {string} url The RPC url to add to frequentRpcList.
   * @param {number} chainId Optional chainId of the selected network.
   * @param {string} ticker   Optional ticker symbol of the selected network.
   * @param {string} nickname Optional nickname of the selected network.
   * @returns {Promise<array>} Promise resolving to updated frequentRpcList.
   *
   */

  async updateRpc (newRpcConfig) {
    const index = this.networkConfigs.findIndex((config) => {
      return config.rpcUrl === newRpcConfig.rpcUrl
    })
    if (index > -1) {
      const config = this.networkConfigs[index]
      this.networkConfigs[index] = extend(config, newRpcConfig)
      this.store.updateState({ networkConfigs: this.networkConfigs })
    } else {
      this.addNetwork(newRpcConfig)
    }

    return this.networkConfigs
  }

  resetConnection () {
    // this.F = this.getProviderConfig()
  }
  //
  // Private
  //

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

}
