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
    }, opts.initState)
    this.store = new ObservableStore(initState)

    this.setupProvider = opts.setupProvider
    this._txController = opts._txController
    this._networkController = opts._networkController
    this._blockTracker = opts._blockTracker
    this._getAccounts = opts._getAccounts
    this.getApi = opts.getApi

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

  async add (pluginName, sourceUrl) {
    if (!sourceUrl) {
      sourceUrl = pluginName
    }

    const plugins = this.store.getState().plugins

    let plugin
    if (false && plugins[pluginName]) {
      plugin = plugins[pluginName]
    } else {
      plugin = await fetch(sourceUrl)
        .then(pluginRes => pluginRes.json())
        .catch(err => console.log('add plugin error:', err))
    }

    const { sourceCode, requestedPermissions } = plugin


    const ethereumProvider = this.setupProvider(pluginName, async () => { return {name: pluginName } }, true)

    return ethereumProvider.sendAsync({
      method: 'wallet_requestPermissions',
      jsonrpc: '2.0',
      params: [{ ['eth_runPlugin_' + pluginName]: {}, ...requestedPermissions }, { sourceCode, ethereumProvider }],
    }, (err1, res1) => {
      if (err1) return err1

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
    const apisToProvide = { onMetaMaskEvent, registerRpcMessageHandler }
    apiList.forEach(apiKey => {
      apisToProvide[apiKey] = possibleApis[apiKey]
    })
    return apisToProvide
  }

  _registerRpcMessageHandler (pluginName, handler) {
    this.rpcMessageHandlers.set(pluginName, handler)
  }

  _startPlugin (pluginName, approvedPermissions, sourceCode, ethereumProvider) {
    const s = SES.makeSESRootRealm({consoleMode: 'allow', errorStackMode: 'allow', mathRandomMode: 'allow'})
    const apisToProvide = this._generateApisToProvide(approvedPermissions, pluginName)
    Object.assign(ethereumProvider, apisToProvide)
    const sessedPlugin = s.evaluate(sourceCode, {
      wallet: ethereumProvider,
      console, // Adding console for now for logging purposes.
    })
    sessedPlugin.run()
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

  // Here is where we need to load requested script via ENS using EIP1577 (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1577.md),
  // example usage here: https://github.com/MetaMask/metamask-extension/pull/6402.

  async _getPluginConfig (pluginName) {
    const res = await fetch(`http://localhost:8081/${pluginName}.json`)
    const json = await res.json()
    return json
  }
}

module.exports = PluginsController
