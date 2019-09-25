const ObservableStore = require('obs-store')
const EventEmitter = require('safe-event-emitter')
const extend = require('xtend')
const SES = require('ses')

class PluginsController extends EventEmitter {

  constructor (opts = {}) {
    super()
    const initState = extend({
      plugins: {},
      pluginStates: {},
      pluginAssets: [{
        symbol: 'TEST_ASSET',
        balance: '200000',
        identifier: 'test:asset',
        decimals: 5,
        customViewUrl: 'https://metamask.io',
      }],
    }, opts.initState)
    this.store = new ObservableStore(initState)

    // TODO:SECURITY disable errorStackMode for production
    this.rootRealm = SES.makeSESRootRealm({consoleMode: 'allow', errorStackMode: 'allow', mathRandomMode: 'allow'})

    this.setupProvider = opts.setupProvider
    this._txController = opts._txController
    this._networkController = opts._networkController
    this._blockTracker = opts._blockTracker
    this._getAccounts = opts._getAccounts
    this.getApi = opts.getApi
    this.getAppKeyForDomain = opts.getAppKeyForDomain

    this.pluginAssets = []
    this.rpcMessageHandlers = new Map()
  }

  runExistingPlugins () {
    const plugins = this.store.getState().plugins
    Object.values(plugins).forEach(({ pluginName, requestedPermissions, sourceCode }) => {
      const ethereumProvider = this.setupProvider(pluginName, async () => { return {name: pluginName } }, true)
      this._startPlugin(pluginName, requestedPermissions, sourceCode, ethereumProvider)
    })
  }

  get (pluginName) {
    return this.store.getState().plugins[pluginName]
  }

  // When a plugin is first created, where should it be executed?
  // And how do we ensure that the same plugin is never executed twice?

  updatePluginState (pluginName, newPluginState) {
    const state = this.store.getState()

    const newPluginStates = { ...state.pluginStates, [pluginName]: newPluginState }

    this.store.updateState({
      ...state,
      pluginStates: newPluginStates,
    })
  }

  getPluginState (pluginName) {
    return this.store.getState().pluginStates[pluginName]
  }

  clearPluginState () {
    this.store.updateState({
      plugins: {},
      pluginStates: {},
    })
  }

  deletePlugin (pluginName) {
    const state = this.store.getState()

    const newPlugins = { ...state.plugins }
    delete newPlugins[pluginName]

    this.store.updateState({
      ...state,
      plugins: newPlugins,
    })
  }

  async add (pluginName, sourceUrl) {
    if (!sourceUrl) {
      sourceUrl = pluginName
    }

    const plugins = this.store.getState().plugins

    let plugin
    if (plugins[pluginName]) {
      plugin = plugins[pluginName]
    } else {
      let _requestedPermissions
      plugin = await fetch(sourceUrl)
        .then(pluginRes => {
          return pluginRes.json()
        })
        .then(({ web3Wallet: { bundle, requestedPermissions } }) => {
           _requestedPermissions = requestedPermissions
          // bundle is an object with: { local: string, url: string }
          return fetch(bundle.url) // TODO: validate params?
        })
        .then(bundleRes => bundleRes.text())
        .then(sourceCode => {
          return {
            sourceCode,
            requestedPermissions: _requestedPermissions,
          }
        })
        .catch(err => console.log('add plugin error:', err))
    }

    const { sourceCode, requestedPermissions } = plugin


    const ethereumProvider = this.setupProvider(pluginName, async () => { return {name: pluginName } }, true)

    return new Promise ((resolve, reject) => {
      ethereumProvider.sendAsync({
        method: 'wallet_requestPermissions',
        jsonrpc: '2.0',
        params: [{ ['eth_runPlugin_' + pluginName]: {}, ...requestedPermissions }, { sourceCode, ethereumProvider }],
      }, (err1, res1) => {
        console.log('err1, res1', err1, res1)
        if (err1) reject(err1)

        const capabilities = res1.result.map(cap => cap.parentCapability).filter(cap => !cap.startsWith('eth_runPlugin_'))

        if (!plugins[pluginName]) {
          const newPlugin = {
            handleRpcRequest: async (result) => {
              return Promise.resolve(result)
            },
            pluginName,
            sourceCode,
            requestedPermissions: capabilities,
          }

          const newPlugins = {...plugins, [pluginName]: newPlugin}

          this.store.updateState({
            plugins: newPlugins,
          })
        }

        ethereumProvider.sendAsync({
          method: 'eth_runPlugin_' + pluginName,
          params: [{ requestedPermissions: capabilities, sourceCode, ethereumProvider }],
        }, (err2, res2) => {
          console.log('plugin.add err2, res2', err2, res2)
          if (err2) reject(err2)
          resolve(res2)
        })
      })
    })
  }

  async run (pluginName, requestedPermissions, sourceCode, ethereumProvider) {
    return this._startPlugin(pluginName, requestedPermissions, sourceCode, ethereumProvider)
  }

  _eventEmitterToListenerMap (eventEmitter) {
    return eventEmitter.eventNames().map(eventName => {
      return {
        [eventName]: eventEmitter.on.bind(eventEmitter, eventName),
      }
    })
  }

  generateMetaMaskListenerMethodsMap () {
    return [
      ...this._eventEmitterToListenerMap(this._txController),
      ...this._eventEmitterToListenerMap(this._networkController),
      ...this._eventEmitterToListenerMap(this._blockTracker),
    ].reduce((acc, methodMap) => ({ ...acc, ...methodMap }))
  }

  _createMetaMaskEventListener (approvedPermissions) {
    const listenerMethodsMap = this.generateMetaMaskListenerMethodsMap()
    const approvedListenerMethodsMap = {}
    approvedPermissions.forEach(approvedPermission => {
      if (listenerMethodsMap[approvedPermission]) {
        approvedListenerMethodsMap[approvedPermission] = listenerMethodsMap[approvedPermission]
      }
    })

    return (eventName, cb) => {
      approvedListenerMethodsMap[eventName](cb)
    }
  }

  _generateApisToProvide (approvedPermissions, pluginName) {
    const apiList = approvedPermissions.map(approvedPermission => {
      const metamaskMethod = approvedPermission.match(/metamask_(.+)/)
      return metamaskMethod
        ? metamaskMethod[1]
        : approvedPermission
    })

    const onMetaMaskEvent = this._createMetaMaskEventListener(apiList)

    const possibleApis = {
      updatePluginState: this.updatePluginState.bind(this, pluginName),
      getPluginState: this.getPluginState.bind(this, pluginName),
      onNewTx: () => {},
      onUnlock: this._onUnlock,
      ...this.getApi(),
    }
    const registerRpcMessageHandler = this._registerRpcMessageHandler.bind(this, pluginName)
    const apisToProvide = {
      onMetaMaskEvent,
      registerRpcMessageHandler,
      getAppKey: () => this.getAppKeyForDomain(pluginName),

      // Asset management:
      registerAsset: this.addPluginAsset.bind(this, pluginName),
      updateAsset: this.updatePluginAsset.bind(this, pluginName),
      removeAsset: this.removePluginAsset.bind(this, pluginName),
    }
    apiList.forEach(apiKey => {
      apisToProvide[apiKey] = possibleApis[apiKey]
    })
    return apisToProvide
  }

  _registerRpcMessageHandler (pluginName, handler) {
    this.rpcMessageHandlers.set(pluginName, handler)
  }

  _startPlugin (pluginName, approvedPermissions, sourceCode, ethereumProvider) {
    const apisToProvide = this._generateApisToProvide(approvedPermissions, pluginName)
    Object.assign(ethereumProvider, apisToProvide)
    const sessedPlugin = this.rootRealm.evaluate(sourceCode, {
      wallet: ethereumProvider,
      console, // Adding console for now for logging purposes.
      BigInt,
      window: {
        crypto,
        SubtleCrypto,
        fetch,
      },
      crypto,
      SubtleCrypto,
      fetch,
    })
    sessedPlugin()
    this._setPluginToActive(pluginName)
    return true
  }

  async _setPluginToActive (pluginName) {
    this._updatePlugin(pluginName, 'isActive', true)
  }

  async _setPluginToInActive (pluginName) {
    this._updatePlugin(pluginName, 'isActive', false)
  }

  async _updatePlugin (pluginName, property, value) {
    const plugins = this.store.getState().plugins
    const plugin = plugins[pluginName]
    const newPlugin = { ...plugin, [property]: value }
    const newPlugins = { ...plugins, [pluginName]: newPlugin }
    this.store.updateState({
      plugins: newPlugins,
    })
  }

  // Asset management
  get pluginAssets () {
    return this.store.getState().pluginAssets
  }

  set pluginAssets (pluginAssets) {
    this.store.updateState({
      pluginAssets,
    })
  }

  addPluginAsset (fromDomain, opts) {
    this.validateAsset(fromDomain, opts)
    const asset = {
      ...opts,
      fromDomain,
    }
    this.pluginAssets.push(asset)
  }

  validateAsset (fromDomain, opts) {
    pluginAssetRequiredFields.forEach((requiredField) => {
      if (!(requiredField in opts)) {
        throw new Error(`Asset from ${fromDomain} missing required field: ${requiredField}`)
      }
    })
  }
  updatePluginAsset (fromDomain, asset) {
    this.validateAsset(fromDomain, asset)
    this.pluginAssets.forEach((asset, index) => {
      if (asset.fromDomain === fromDomain && asset.identifier === identifier) {
        this.pluginAssets[index] = asset
      }
    })
  }

  removePluginAsset (fromDomain, asset) {
    this.pluginAssets = this.pluginAssets.filter((asset, index) => {
      const requested = asset.fromDomain === fromDomain && asset.identifier === identifier
      return !requested
    })
  }

}

module.exports = PluginsController
