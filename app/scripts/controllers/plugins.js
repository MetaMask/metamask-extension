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
    this._onUnlock = opts._onUnlock
    this._onNewTx = opts._onNewTx
    this._subscribeToPreferencesControllerChanges = opts._subscribeToPreferencesControllerChanges
    this._updatePreferencesControllerState = opts._updatePreferencesControllerState
    this._signPersonalMessage = opts._signPersonalMessage
    this._getAccounts = opts._getAccounts
    this.getApi = opts.getApi
  }

  get (pluginName) {
    return this.store.getState().plugins[pluginName]
  }

  // When a plugin is first created, where should it be executed?
    // And how do we ensure that the same plugin is never executed twice?

  updatePluginState (pluginName, newPluginState) {
    const plugins = this.store.getState().plugins
    const plugin = plugins[pluginName]
    const updatedPlugin = { ...plugin, pluginState: newPluginState }

    const newPlugins = {...plugins, [pluginName]: updatedPlugin}

    this.store.updateState({
      plugins: newPlugins,
    })
  }

  getPluginState (pluginName) {
    const plugin = this.store.getState().plugins[pluginName]
    return plugin ? plugin.pluginState : null
  }

  async add(pluginName, sourceUrl) {
    const plugins = this.store.getState().plugins

    let plugin
    if (false && plugins[pluginName]) {
      plugin = plugins[pluginName]
    } else {
      plugin = await fetch(sourceUrl)
        .then(pluginRes => pluginRes.json())
    }

    const { sourceCode, requestedPermissions } = plugin

    if (!plugins[pluginName]) {
      const newPlugin = {
        handleRpcRequest: async (result) => {
          return Promise.resolve(result)
        },
        pluginName,
        sourceCode,
        requestedPermissions,
        pluginState: {},
      }

      const newPlugins = {...plugins, [pluginName]: newPlugin}

      this.store.updateState({
        plugins: newPlugins,
      })
    }

    const ethereumProvider = this.setupProvider(pluginName, async () => { return {name: pluginName } })

    return ethereumProvider.sendAsync({
      method: 'wallet_requestPermissions',
      jsonrpc: '2.0',
      params: [{ ['eth_runPlugin_' + pluginName]: {}, ...requestedPermissions }, { sourceCode, ethereumProvider }],
    }, (err1, res1) => {
      if (err1) return err1

      const capabilities = res1.result.map(cap => cap.parentCapability).filter(cap => !cap.startsWith('eth_runPlugin_'))
      
      ethereumProvider.sendAsync({
        method: 'eth_runPlugin_' + pluginName,
        params: [{ requestedPermissions: capabilities, sourceCode, ethereumProvider }],
      }, (err2, res2) => {
        console.log('plugin.add err2, res2', err2, res2)
      })
    })
  }

  async run (pluginName, requestedPermissions, sourceCode, ethereumProvider) {
    this._startPlugin(pluginName, requestedPermissions, sourceCode, ethereumProvider)
  }

  _generateApisToProvide (requestedPermissions, pluginName) {
    const apiList = requestedPermissions
    const updatePluginState = this.updatePluginState.bind(this, pluginName)
    const getPluginState = this.getPluginState.bind(this, pluginName)
    const possibleApis = {
      updatePluginState,
      getPluginState,
      onNewTx: this._onNewTx,
      onUnlock: this._onUnlock,
      ...this.getApi(),
    }
    const apisToProvide = {}
    apiList.forEach(apiKey => {
      apisToProvide[apiKey] = possibleApis[apiKey]
    })
    return apisToProvide
  }

  _startPlugin (pluginName, requestedPermissions, sourceCode, ethereumProvider) {
    const s = SES.makeSESRootRealm({consoleMode: 'allow', errorStackMode: 'allow', mathRandomMode: 'allow'})
    const apisToProvide = this._generateApisToProvide(requestedPermissions, pluginName)
    Object.assign(ethereumProvider, apisToProvide)
    const sessedPlugin = s.evaluate(sourceCode, {
      ethereumProvider,
    })
    sessedPlugin.run()
    this._setPluginToActive(pluginName)
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