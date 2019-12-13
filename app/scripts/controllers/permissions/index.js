const JsonRpcEngine = require('json-rpc-engine')
const asMiddleware = require('json-rpc-engine/src/asMiddleware')
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const ObservableStore = require('obs-store')
const RpcCap = require('rpc-cap').CapabilitiesController
const { ethErrors } = require('eth-json-rpc-errors')

const {
  getExternalRestrictedMethods,
  pluginRestrictedMethodDescriptions,
} = require('./restrictedMethods')
const createMethodMiddleware = require('./methodMiddleware')
const createLoggerMiddleware = require('./loggerMiddleware')

const {
  SAFE_METHODS, // methods that do not require any permissions to use
  WALLET_PREFIX,
  PLUGIN_PREFIX,
  METADATA_STORE_KEY,
  LOG_STORE_KEY,
  HISTORY_STORE_KEY,
  CAVEAT_NAMES,
  NOTIFICATION_NAMES,
} = require('./enums')

function prefix (method) {
  return WALLET_PREFIX + method
}

class PermissionsController {

  constructor ({
    openPopup, closePopup, keyringController, assetsController,
    setupProvider, pluginRestrictedMethods, getApi, notifyDomain,
    notifyAllDomains,
  } = {}, restoredState = {}
  ) {
    this.store = new ObservableStore({
      [METADATA_STORE_KEY]: restoredState[METADATA_STORE_KEY] || {},
      [LOG_STORE_KEY]: restoredState[LOG_STORE_KEY] || [],
      [HISTORY_STORE_KEY]: restoredState[HISTORY_STORE_KEY] || {},
    })
    this.notifyDomain = notifyDomain
    this.notifyAllDomains = notifyAllDomains
    this._openPopup = openPopup
    this._closePopup = closePopup
    this.keyringController = keyringController
    this.assetsController = assetsController
    this.setupProvider = setupProvider
    this.externalRestrictedMethods = getExternalRestrictedMethods(this)
    this.pluginRestrictedMethods = pluginRestrictedMethods
    this.getApi = getApi
  }

  // Middleware-related methods

  createMiddleware ({ origin, extensionId, isPlugin }) {

    if (extensionId) {
      this.store.updateState({
        [METADATA_STORE_KEY]: {
          ...this.store.getState()[METADATA_STORE_KEY],
          [origin]: { extensionId },
        },
      })
    }

    const engine = new JsonRpcEngine()
    engine.push(this.createPluginMethodRestrictionMiddleware(isPlugin))
    engine.push(createMethodMiddleware({
      store: this.store,
      storeKey: METADATA_STORE_KEY,
      getAccounts: this.getAccounts.bind(this, origin),
      requestPermissions: this._requestPermissions.bind(this, origin),
      installPlugins: this.installPlugins.bind(this),
    }))
    engine.push(createLoggerMiddleware({
      walletPrefix: WALLET_PREFIX,
      restrictedMethods: (
        Object.keys(this.externalRestrictedMethods)
          .concat(Object.keys(this.pluginRestrictedMethods))
      ),
      store: this.store,
      logStoreKey: LOG_STORE_KEY,
      historyStoreKey: HISTORY_STORE_KEY,
    }))
    engine.push(this.permissions.providerMiddlewareFunction.bind(
      this.permissions, { origin }
    ))
    return asMiddleware(engine)
  }

  /**
   * Create middleware for prevent non-plugins from accessing methods only available to plugins
   */
  createPluginMethodRestrictionMiddleware (isPlugin) {
    return createAsyncMiddleware(async (req, res, next) => {
      if (typeof req.method !== 'string') {
        res.error = ethErrors.rpc.invalidRequest({ data: req })
        return // TODO:json-rpc-engine
      }

      if (pluginRestrictedMethodDescriptions[req.method] && !isPlugin) {
        res.error = ethErrors.rpc.methodNotFound({ data: req.method })
        return
      }

      return next()
    })
  }

  /**
   * Submits a permissions request to rpc-cap. Internal use only.
   * Other modules should send an RPC request.
   *
   * @param {string} origin - The origin string.
   * @param {IRequestedPermissions} permissions - The requested permissions.
   */
  _requestPermissions (origin, permissions) {
    return new Promise((resolve, reject) => {

      const req = { method: 'wallet_requestPermissions', params: [permissions] }
      const res = {}
      this.permissions.providerMiddlewareFunction(
        { origin }, req, res, () => {}, _end
      )

      function _end (err) {
        if (err || res.error) {
          reject(err || res.error)
        } else {
          resolve(res.result)
        }
      }
    })
  }

  // Permission-related methods

  /**
   * User approval callback.
   * @param {object} approved the approved request object
   */
  async approvePermissionsRequest (approved, accounts) {
    const { id } = approved.metadata
    const approval = this.pendingApprovals[id]

    delete this.pendingApprovals[id]
    if (Object.keys(this.pendingApprovals).length === 0) {
      this._closePopup && this._closePopup()
    }

    try {

      // attempt to finalize the request and resolve it
      await this.finalizePermissionsRequest(approved.permissions, accounts)
      approval.resolve(approved.permissions)

    } catch (err) {

      // if finalization fails, reject the request
      approval.reject(ethErrors.rpc.invalidRequest({
        message: err.message, data: err,
      }))
    }
  }

  /**
   * User rejection callback.
   * @param {string} id the id of the rejected request
   */
  async rejectPermissionsRequest (id) {
    const approval = this.pendingApprovals[id]

    delete this.pendingApprovals[id]
    if (Object.keys(this.pendingApprovals).length === 0) {
      this._closePopup && this._closePopup()
    }

    approval.reject(false)
  }

  /**
   * Finalizes a permissions request.
   * Throws if request validation fails.
   *
   * @param {Object} requestedPermissions - The requested permissions.
   * @param {string[]} accounts - The accounts to expose, if any.
   */
  async finalizePermissionsRequest (requestedPermissions, accounts) {

    const { eth_accounts: ethAccounts } = requestedPermissions

    if (ethAccounts) {

      await this.validateExposedAccounts(accounts)

      if (!ethAccounts.caveats) {
        ethAccounts.caveats = []
      }

      // caveat names are unique, and we will only construct this caveat here
      ethAccounts.caveats = ethAccounts.caveats.filter(c => (
        c.name !== CAVEAT_NAMES.exposedAccounts
      ))

      ethAccounts.caveats.push(
        {
          type: 'filterResponse',
          value: accounts,
          name: CAVEAT_NAMES.exposedAccounts,
        },
      )
    }
  }

  /**
   * Removes the given permissions for the given domain.
   * @param {object} domains { origin: [permissions] }
   */
  removePermissionsFor (domains) {

    Object.entries(domains).forEach(([origin, perms]) => {

      this.permissions.removePermissionsFor(
        origin,
        perms.map(methodName => {

          if (methodName === 'eth_accounts') {
            this.notifyDomain(
              origin,
              { method: NOTIFICATION_NAMES.accountsChanged, result: [] }
            )
          }

          return { parentCapability: methodName }
        })
      )
    })
  }

  /**
   * Removes all permissions for the given domains.
   * @param {Array<string>} domainsToDelete - The domains to remove all permissions for.
   */
  removeAllPermissionsFor (domainsToDelete) {
    const domains = this.permissions.getDomains()
    domainsToDelete.forEach(d => {
      delete domains[d]
      this.notifyDomain(d, {
        method: NOTIFICATION_NAMES.accountsChanged,
        result: [],
      })
    })
    this.permissions.setDomains(domains)
  }

  // Caveat-related methods

  /**
   * Gets all caveats for the given origin and permission, or returns null
   * if none exist.
   *
   * @param {string} permission - The name of the target permission.
   * @param {string} origin - The origin that has the permission.
   */
  getCaveatsFor (permission, origin) {
    return this.permissions.getCaveats(origin, permission) || null
  }

  /**
   * Gets the caveat with the given name for the given permission of the
   * given origin.
   *
   * @param {string} permission - The name of the target permission.
   * @param {string} origin - The origin that has the permission.
   * @param {string} caveatName - The name of the caveat to retrieve.
   */
  getCaveat (permission, origin, caveatName) {
    return this.permissions.getCaveat(origin, permission, caveatName)
  }

  // Account-related methods

  /**
   * Returns the accounts that should be exposed for the given origin domain,
   * if any. This method exists for when a trusted context needs to know
   * which accounts are exposed to a given domain.
   *
   * Do not use in untrusted contexts; just send an RPC request.
   *
   * @param {string} origin
   */
  getAccounts (origin) {
    return new Promise((resolve, _) => {
      const req = { method: 'eth_accounts' }
      const res = {}
      this.permissions.providerMiddlewareFunction(
        { origin }, req, res, () => {}, _end
      )

      function _end () {
        if (res.error || !Array.isArray(res.result)) {
          resolve([])
        } else {
          resolve(res.result)
        }
      }
    })
  }

  /**
   * Grants the given origin the eth_accounts permission for the given account(s).
   * This method should ONLY be called as a result of direct user action in the UI,
   * with the intention of supporting legacy dapps that don't support EIP 1102.
   *
   * @param {string} origin - The origin to expose the account(s) to.
   * @param {Array<string>} accounts - The account(s) to expose.
   */
  async legacyExposeAccounts (origin, accounts) {

    const permissions = {
      eth_accounts: {},
    }

    await this.finalizePermissionsRequest(permissions, accounts)

    let error
    try {
      error = await new Promise((resolve) => {
        this.permissions.grantNewPermissions(origin, permissions, {}, err => resolve(err))
      })
    } catch (err) {
      error = err
    }

    if (error) {
      if (error.code === 4001) {
        throw error
      } else {
        throw ethErrors.rpc.internal({
          message: `Failed to add 'eth_accounts' to '${origin}'.`,
          data: {
            originalError: error,
            accounts,
          },
        })
      }
    }
  }

  /**
   * Update the accounts exposed to the given origin.
   * Throws error if the update fails.
   *
   * @param {string} origin - The origin to change the exposed accounts for.
   * @param {string[]} accounts - The new account(s) to expose.
   */
  async updateExposedAccounts (origin, accounts) {

    await this.validateExposedAccounts(accounts)

    this.permissions.updateCaveatFor(
      origin, 'eth_accounts', CAVEAT_NAMES.exposedAccounts, accounts
    )

    this.notifyDomain(origin, {
      method: NOTIFICATION_NAMES.accountsChanged,
      result: accounts,
    })
  }

  /**
   * Validate an array of accounts representing accounts to be exposed
   * to a domain. Throws error if validation fails.
   *
   * @param {string[]} accounts - An array of addresses.
   */
  async validateExposedAccounts (accounts) {

    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('Must provide non-empty array of account(s).')
    }

    // assert accounts exist
    const allAccounts = await this.keyringController.getAccounts()
    accounts.forEach(acc => {
      if (!allAccounts.includes(acc)) {
        throw new Error(`Unknown account: ${acc}`)
      }
    })
  }

  // Plugin-related methods

  /**
   * @param {string} origin - The external domain id.
   * @param {Object} requestedPlugins - The names of the requested plugin permissions.
   */
  async installPlugins (origin, requestedPlugins) {

    const existingPerms = this.permissions.getPermissionsForDomain(origin).reduce(
      (acc, p) => {
        acc[p.parentCapability] = true
        return acc
      }, {}
    )

    const result = {}

    // use a for-loop so that we can return an object and await the resolution
    // of each call to processRequestedPlugin
    await Promise.all(Object.keys(requestedPlugins).map(async pluginName => {

      const permissionName = PLUGIN_PREFIX + pluginName
      result[pluginName] = {
        permission: permissionName,
      }

      // only allow the installation of permitted plugins
      if (!existingPerms[permissionName]) {

        result[pluginName].error = ethErrors.provider.unauthorized(
          `Not authorized to install plugin '${pluginName}'. Please request the permission for the plugin before attempting to install it.`
        )
      } else {

        // attempt to install and run the plugin, storing any errors that
        // occur during the process
        result[pluginName] = {
          ...result[pluginName],
          ...(await this.pluginsController.processRequestedPlugin(pluginName)),
        }
      }
    }))
    return result
  }

  // State-related methods

  /**
   * Removes all known domains and their related permissions.
   */
  clearPermissions () {
    this.permissions.clearDomains()
    this.notifyAllDomains({
      method: NOTIFICATION_NAMES.accountsChanged,
      result: [],
    })
  }

  /**
   * Clears the permissions log.
   */
  clearLog () {
    this.store.updateState({
      [LOG_STORE_KEY]: [],
    })
  }

  /**
   * Clears the permissions history.
   */
  clearHistory () {
    this.store.updateState({
      [HISTORY_STORE_KEY]: {},
    })
  }

  // rpc-cap-related methods

  /**
   * Initializes the underlying CapabilitiesController.
   * Exposed in case it must be called after constructor due to controller
   * initialization order.
   *
   * @param {Object} opts - The CapabilitiesController options.
   * @param {Object} opts.metamaskEventMethods - Plugin-related internal event methods.
   * @param {Object} opts.pluginRestrictedMethods - Restricted methods for plugins, if any.
   * @param {Object} opts.restoredPermissions - The restored permissions state, if any.
   */
  initializePermissions ({
    pluginsController,
    metamaskEventMethods = {},
    pluginRestrictedMethods = {},
    restoredPermissions = {},
  } = {}) {

    this.pluginsController = pluginsController
    this.metamaskEventMethods = metamaskEventMethods
    this.pluginRestrictedMethods = pluginRestrictedMethods

    const initState = Object.keys(restoredPermissions)
      .filter(k => {
        return ![
          'permissionsDescriptions',
          'permissionsRequests',
        ].includes(k)
      })
      .reduce((acc, k) => {
        acc[k] = restoredPermissions[k]
        return acc
      }, {})

    this.pendingApprovals = {}

    const api = this.getApi()

    const externalMethodsToAddToRestricted = {
      ...this.pluginRestrictedMethods,
      ...api,
      ...this.metamaskEventMethods,
      removePermissionsFor: this.removePermissionsFor.bind(this),
      getApprovedAccounts: this.getAccounts.bind(this),
    }

    const namespacedPluginRestrictedMethods = Object.keys(
      externalMethodsToAddToRestricted
    ).reduce((acc, methodKey) => {
      const hasDescription = externalMethodsToAddToRestricted[methodKey]
      if (!hasDescription) {
        return acc
      }
      return {
        ...acc,
        ['metamask_' + methodKey]: {
          description: pluginRestrictedMethodDescriptions[methodKey] || methodKey,
          method: 'metamask_' + externalMethodsToAddToRestricted[methodKey],
        },
      }
    }, {})

    this.permissions = new RpcCap({

      // Supports passthrough methods:
      safeMethods: SAFE_METHODS,

      // optional prefix for internal methods
      methodPrefix: WALLET_PREFIX,

      restrictedMethods: {
        ...this.externalRestrictedMethods, ...namespacedPluginRestrictedMethods,
      },

      /**
       * A promise-returning callback used to determine whether to approve
       * permissions requests or not.
       *
       * Currently only returns a boolean, but eventually should return any specific parameters or amendments to the permissions.
       *
       * @param {string} domain - The requesting domain string
       * @param {string} req - The request object sent in to the `requestPermissions` method.
       * @returns {Promise<bool>} approved - Whether the user approves the request or not.
       */
      requestUserApproval: async (options) => {
        const { metadata } = options
        const { id } = metadata

        this._openPopup && this._openPopup()

        return new Promise((resolve, reject) => {
          this.pendingApprovals[id] = { resolve, reject }
        })
      },
    }, initState)
  }
}

module.exports = {
  PermissionsController,
  addInternalMethodPrefix: prefix,
}
