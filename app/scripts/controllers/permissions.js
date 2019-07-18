const JsonRpcEngine = require('json-rpc-engine')
const asMiddleware = require('json-rpc-engine/src/asMiddleware')
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const RpcCap = require('json-rpc-capabilities-middleware').CapabilitiesController
const uuid = require('uuid/v4')

// Methods that do not require any permissions to use:
const SAFE_METHODS = require('../lib/permissions-safe-methods.json')

// listener call back for keyring store updates
const updateCallback = resolve => state => {
  if (state.isUnlocked) resolve()
}

// class PermissionsController extends SafeEventEmitter {
class PermissionsController {

  constructor ({
    openPopup, closePopup, keyringController
  } = {}, restoredState) {
    this._openPopup = openPopup
    this._closePopup = closePopup
    this.keyringController = keyringController
    this._initializePermissions(restoredState)
    // TODO:deprecate ?
    this.engines = {}
  }

  createMiddleware (options) {
    const { origin } = options
    const engine = new JsonRpcEngine()
    engine.push(this.createRequestMiddleware(options))
    engine.push(this.permissions.providerMiddlewareFunction.bind(
      this.permissions, { origin }
    ))
    this.engines[origin] = engine
    return asMiddleware(engine)
  }

  /**
   * Create middleware for preprocessing permissions requests.
   */
  createRequestMiddleware () {
    return createAsyncMiddleware(async (req, res, next) => {

      const keyring = this.keyringController

      /**
       * TODO:lps:review as a placeholder, we currently set a 10-second timer,
       * then reject the request. We can't use a .once listener, for reasons
       * described below. Recommend re-implementing this such that RPC calls
       * are blocked further up the stack. The goal must be to keep the RPC
       * calls out of the rpc-cap middleware until the extension is unlocked.
       */
      // wait for unlock
      if (!keyring.memStore.getState().isUnlocked) {
        try {
          this._openPopup()
          await new Promise((resolve, reject) => {
            let cb = updateCallback(resolve)
            // we cannot use .once since we cannot know which 'update' event
            // changes the isUnlocked property
            keyring.memStore.on('update', cb)
            setTimeout(() => {
              reject()
              keyring.memStore.removeListener('update', cb)
            }, 10000)
          })
        } catch (error) {
          res.error = { code: 1, message: 'User denied access.' }
          return
        }
      }

      // validate and add metadata to permissions requests
      if (req.method === 'wallet_requestPermissions') {

        if (
          !Array.isArray(req.params) ||
          req.params.length !== 1 ||
          typeof req.params[0] !== 'object' ||
          Array.isArray(req.params[0]) ||
          Object.keys(req.params[0]).length !== 1
        ) throw new Error('Bad request.')

        // add unique id and site metadata to request params, as expected by
        // json-rpc-capabilities-middleware
        const metadata = {
          metadata: {
            id: uuid(),
            site: (
              req._siteMetadata
              ? req._siteMetadata
              : { name: null, icon: null }
            ),
          },
        }
        req.params.push(metadata)
      }

      return next()
    })
  }

  // TODO:lps:review see initializeProvider() in metamask-controller
  /**
   * Returns the accounts that should be exposed for the given origin domain,
   * if any.
   * @param {string} origin
   */
  async getAccounts (origin) {
    return new Promise((resolve, reject) => {
      // TODO:lps:review This error will almost certainly occur when permissions
      // are cleared (see clearPermissions below). Rejecting with an error
      // may be fine?
      if (!this.engines[origin]) reject(new Error('Unknown origin: ${origin}'))
      this.engines[origin].handle(
        { method: 'eth_accounts' },
        (err, res) => {
          if (err || res.error || !Array.isArray(res.result)) {
            resolve([])
          } else {
            resolve(res.result)
          }
        }
      )
    })
  }

  /**
   * Removes all known domains their related permissions.
   */
  clearPermissions () {
    this.permissions.clearDomains()
    Object.keys(this.engines).forEach(s => {
      delete this.engines[s]
    })
  }

  /**
   * User approval callback.
   * @param {object} approved the approved request object
   */
  async approvePermissionsRequest (approved) {
    const { id } = approved.metadata
    const approval = this.pendingApprovals[id]
    const res = approval.res
    res(approved.permissions)
    this._closePopup && this._closePopup()
    delete this.pendingApprovals[id]
  }

  /**
   * User rejection callback.
   * @param {string} id the id of the rejected request
   */
  async rejectPermissionsRequest (id) {
    const approval = this.pendingApprovals[id]
    const rej = approval.rej
    rej(false)
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
    this.testProfile = {
      name: 'Dan Finlay',
    }

    this.pendingApprovals = {}

    this.permissions = new RpcCap({

      // Supports passthrough methods:
      safeMethods: SAFE_METHODS,

      // optional prefix for internal methods
      methodPrefix: 'wallet_',

      restrictedMethods: {

        'eth_accounts': {
          description: 'View Ethereum accounts',
          method: (_, res, __, end) => {
            this.keyringController.getAccounts()
            .then((accounts) => {
              res.result = accounts
              end()
            })
            .catch((reason) => {
              res.error = reason
              end(reason)
            })
          },
        },

        // Restricted methods themselves are defined as
        // json-rpc-engine middleware functions.
        'readYourProfile': {
          description: 'Read from your profile',
          method: (_req, res, _next, end) => {
            res.result = this.testProfile
            end()
          },
        },
        'writeToYourProfile': {
          description: 'Write to your profile.',
          method: (req, res, _next, end) => {
            const [ key, value ] = req.params
            this.testProfile[key] = value
            res.result = this.testProfile
            return end()
          },
        },
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

        return new Promise((res, rej) => {
          this.pendingApprovals[id] = { res, rej }
        },
        // TODO: This should be persisted/restored state.
        {})

        // TODO: Attenuate requested permissions in approval screen.
        // Like selecting the account to display.
      },
    }, restoredState)
  }

}

module.exports = PermissionsController
