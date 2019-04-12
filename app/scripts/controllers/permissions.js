// Methods that do not require any permissions to use:
const SAFE_METHODS = require('../lib/permissions-safe-methods.json')
const createPermissions = require('json-rpc-capabilities-middleware')
const ComposableObservableStore = require('../lib/ComposableObservableStore')


class PermissionsController {

  constructor ({ openPopup } = {}) {
    this._openPopup = openPopup
    const initState = { permissions: {}, requests: {} }

    this._initializePermissions()
    // setup stores
    this.store = this.permissions.store
    this.memStore = new ComposableObservableStore(initState, {
      permissions: this.permissions.store,
      requests: this.permissions.memStore,
    })
  }

  createMiddleware ({ origin }) {
    return this.permissions.providerMiddlewareFunction.bind(this.permissions, origin)
  }

  async approvePermissionRequest (id) {
    const approval = this.pendingApprovals[id]
    const res = approval.res
    res(true)
    this.opts.closePopup && this.opts.closePopup()
    delete this.pendingApprovals[id]
  }

  async rejectPermissionRequest (id) {
    const approval = this.pendingApprovals[id]
    const rej = approval.rej
    rej(false)
    this.opts.closePopup && this.opts.closePopup()
    delete this.pendingApprovals[id]
  }

  async approvePermissions (domain, opts) {
    this.permissions.setPermissionsFor(domain, opts)
  }

  async selectAccountsFor (domain, opts) {
    const accounts = await this.keyringController.getAccounts()
    const approved = accounts.filter(acct => confirm(`Would you like to reveal account ${acct}?`))
    return {
      caveats: [{
        type: 'static',
        value: approved,
      }],
    }
  }

   /*
   * A convenience method for retrieving a login object
   * or creating a new one if needed.
   *
   * @param {string} origin = The origin string representing the domain.
   */
  _initializePermissions () {
    this.testProfile = {
      name: 'Dan Finlay',
    }

    this.pendingApprovals = {}

    this.permissions = createPermissions({

       // Supports passthrough methods:
      safeMethods: SAFE_METHODS,

       // optional prefix for internal methods
      methodPrefix: 'wallet_',

      restrictedMethods: {

        'eth_accounts': {
          description: 'View Ethereum accounts',
          method: (req, res, next, end) => {
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
          method: (req, res, next, end) => {
            res.result = this.testProfile
            end()
          },
        },
        'writeToYourProfile': {
          description: 'Write to your profile.',
          method: (req, res, next, end) => {
            const [ key, value ] = req.params
            this.testProfile[key] = value
            res.result = this.testProfile
            return end()
          },
        },
      },

       /*
      * A promise-returning callback used to determine whether to approve
      * permissions requests or not.
      *
      * Currently only returns a boolean, but eventually should return any specific parameters or amendments to the permissions.
      *
      * @param {string} domain - The requesting domain string
      * @param {string} req - The request object sent in to the `requestPermissions` method.
      * @returns {Promise<bool>} approved - Whether the user approves the request or not.
      */
      requestUserApproval: async (metadata, opts) => {
        const { id } = metadata

        // const restricted = this.permissions.restrictedMethods
        // const descriptions = Object.keys(opts).map(method => restricted[method].description)

        // const message = `The site ${siteTitle} at ${origin} would like permission to:\n - ${descriptions.join('\n- ')}`
        this._openPopup && this._openPopup()

        return new Promise((res, rej) => {
          this.pendingApprovals[id] = { res, rej }
        })

         // TODO: Attenuate requested permissions in approval screen.
        // Like selecting the account to display.
      },
    })
  }

}

module.exports = PermissionsController
