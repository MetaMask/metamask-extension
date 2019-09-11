const JsonRpcEngine = require('json-rpc-engine')
const asMiddleware = require('json-rpc-engine/src/asMiddleware')
const ObservableStore = require('obs-store')
const RpcCap = require('json-rpc-capabilities-middleware').CapabilitiesController

const getRestrictedMethods = require('./restrictedMethods')
const createRequestMiddleware = require('./requestMiddleware')
const createLoggerMiddleware = require('./loggerMiddleware')

// Methods that do not require any permissions to use:
const SAFE_METHODS = require('./permissions-safe-methods.json')

const METADATA_STORE_KEY = 'siteMetadata'
const LOG_STORE_KEY = 'permissionsLog'
const HISTORY_STORE_KEY = 'permissionsHistory'
const WALLET_METHOD_PREFIX = 'wallet_'
const INTERNAL_METHOD_PREFIX = 'metamask_'

function prefix (method) {
  return WALLET_METHOD_PREFIX + method
}

// class PermissionsController extends SafeEventEmitter {
class PermissionsController {

  constructor (
    { openPopup, closePopup, keyringController} = {},
    restoredPermissions = {},
    restoredState = {}) {
    this.store = new ObservableStore({
      [METADATA_STORE_KEY]: restoredState[METADATA_STORE_KEY] || {},
      [LOG_STORE_KEY]: restoredState[LOG_STORE_KEY] || [],
      [HISTORY_STORE_KEY]: restoredState[HISTORY_STORE_KEY] || {},
    })
    this._openPopup = openPopup
    this._closePopup = closePopup
    this.keyringController = keyringController
    this._restrictedMethods = getRestrictedMethods(this)
    this._initializePermissions(restoredPermissions)
  }

  createMiddleware (options) {
    const { origin } = options
    const engine = new JsonRpcEngine()
    engine.push(createRequestMiddleware({
      internalPrefix: INTERNAL_METHOD_PREFIX,
      store: this.store,
      storeKey: METADATA_STORE_KEY,
    }))
    engine.push(createLoggerMiddleware({
      walletPrefix: WALLET_METHOD_PREFIX,
      restrictedMethods: Object.keys(this._restrictedMethods),
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
        if (res.error || !Array.isArray(res.result)) resolve([])
        else resolve(res.result)
      }
    })
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
          return { parentCapability: methodName }
        })
      )
    })
  }

  /**
   * Removes all known domains and their related permissions.
   */
  clearPermissions () {
    this.permissions.clearDomains()
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

  /**
   * User approval callback.
   * @param {object} approved the approved request object
   */
  async approvePermissionsRequest (approved) {
    const { id } = approved.metadata
    const approval = this.pendingApprovals[id]
    const resolve = approval.resolve
    resolve(approved.permissions)
    this._closePopup && this._closePopup()
    delete this.pendingApprovals[id]
  }

  /**
   * User rejection callback.
   * @param {string} id the id of the rejected request
   */
  async rejectPermissionsRequest (id) {
    const approval = this.pendingApprovals[id]
    const reject = approval.reject
    reject(false) // TODO:lps:review should this be an error instead?
    this._closePopup && this._closePopup()
    delete this.pendingApprovals[id]
  }

  /**
   * A convenience method for retrieving a login object
   * or creating a new one if needed.
   *
   * @param {string} origin = The origin string representing the domain.
   */
  _initializePermissions (restoredState) {

    // these permission requests are almost certainly stale
    const initState = { ...restoredState, permissionsRequests: [] }

    this.testProfile = {
      name: 'Dan Finlay',
    }

    this.pendingApprovals = {}

    this.permissions = new RpcCap({

      // Supports passthrough methods:
      safeMethods: SAFE_METHODS,

      // optional prefix for internal methods
      methodPrefix: WALLET_METHOD_PREFIX,

      restrictedMethods: this._restrictedMethods,

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
