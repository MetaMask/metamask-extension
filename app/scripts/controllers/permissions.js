const JsonRpcEngine = require('json-rpc-engine')
const asMiddleware = require('json-rpc-engine/src/asMiddleware')
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const ObservableStore = require('obs-store')
const RpcCap = require('json-rpc-capabilities-middleware').CapabilitiesController
const { errors: rpcErrors } = require('eth-json-rpc-errors')

const pluginRestrictedMethodsDescriptions = {
  onNewTx: 'Take action whenever a new transaction is created',
  fetch: 'Retrieve data from external sites',
  updatePluginState: 'Store data locally',
  onUnlock: 'Take action when you unlock your account',
  Box: 'Backup your data to 3Box',
  subscribeToPreferencesControllerChanges: 'Access your preferences and take action when they change',
  updatePreferencesControllerState: 'Update/modify your preferences',
  generateSignature: 'Sign messages with your account',

  // MetaMaskController#getApi
  addKnownMethodData: 'Update and store data about a known contract method',
  addNewAccount: 'Adds a new account to the default (first) HD seed phrase Keyring',
  addNewKeyring: 'Create a new keyring',
  addToken: 'Add a new token to be tracked',
  buyEth: 'Forwards the user to the easiest way to obtain ether for the currently-selected network',
  checkHardwareStatus: 'Check if the hardware device is unlocked',
  connectHardware: 'Fetch account list from a Trezor device',
  createShapeShiftTx: 'Triggers a ShapeShift currency transfer',
  delCustomRpc: 'Delete a selected custom URL',
  estimateGas: 'Estimate the gas required for a transaction',
  fetchInfoToSync: 'Collects all the information for mobile syncing',
  forgetDevice: 'Clear all connected devices',
  getApprovedAccounts: 'Get a list of all approved accounts',
  getFilteredTxList: 'Get a list of filtered transactions',
  getGasPrice: 'Estimates a good gas price at recent prices',
  getState: 'Get a JSON representation of MetaMask data, including sensitive data. This is only for testing purposes and will NOT be included in production.',
  importAccountWithStrategy: 'Imports an account with the specified import strategy',
  isNonceTaken: 'Check if a given nonce is available for use',
  removeAccount: 'Removes an account from state / storage',
  removeFromAddressBook: 'Remove an entry from the address book',
  removePermissionsFor: 'Remove account access for a given domain',
  removeSuggestedTokens: 'Remove a token  from the list of suggested tokens',
  removeToken: 'Remove a token from the list of tracked tokens',
  resetAccount: 'Clears the transaction history, to allow users to force-reset their nonces',
  setAccountLabel: 'Set the label for the currently-selected account',
  setAddressBook: 'Add or update an entry in the address book',
  setCurrentAccountTab: 'Set the active tab for the currently-selected account',
  setCurrentCurrency: 'Set the currently-selected currency',
  setCurrentLocale: 'Set the current locale, affecting the language rendered',
  setCustomRpc: 'Select a custom URL for an Ethereum RPC provider',
  setFeatureFlag: 'Enable or disable a given feature-flag',
  setParticipateInMetaMetrics: 'Toggle usage data tracking with MetaMetrics',
  setPreference: 'Update a given user preference',
  setProviderType: 'Update the current provider type',
  setSeedPhraseBackedUp: 'Mark a seed phrase as backed up',
  setSelectedAddress: 'Set the currently-selected address',
  setUseBlockie: 'Toggle the Blockie identicon format',
  submitPassword: 'Submits the user password and attempts to unlock the vault. This will not be included in production.',
  unMarkPasswordForgotten: 'Allows a user to end the seed phrase recovery process',
  unlockHardwareWalletAccount: 'Imports an account from a Trezor device',
  updateAndSetCustomRpc: 'Select a custom URL for an Ethereum RPC provider and updating it',
  verifySeedPhrase: 'Verifies the validity of the current vault seed phrase',
  whitelistPhishingDomain: 'Mark a malicious-looking domain as safe',

  // Listening to events from the block tracker, transaction controller and network controller
  'tx:status-update': 'Be notified when the status of your transactions changes',
  latest: 'Be notified when the new blocks are added to the blockchain',
  networkDidChange: 'Be notified when your selected network changes',
  newUnapprovedTx: 'Be notified with details of your new transactions',
}

// Methods that do not require any permissions to use:
const SAFE_METHODS = require('../lib/permissions-safe-methods.json')

const METHOD_PREFIX = 'wallet_'
const INTERNAL_METHOD_PREFIX = 'metamask_'

function prefix (method) {
  return METHOD_PREFIX + method
}

// class PermissionsController extends SafeEventEmitter {
class PermissionsController {

  constructor ({
    openPopup, closePopup, keyringController, pluginsController, setupProvider, pluginRestrictedMethods, getApi, metamaskEventMethods
  } = {}, restoredState) {
    this.memStore = new ObservableStore({ siteMetadata: {} })
    this._openPopup = openPopup
    this._closePopup = closePopup
    this.keyringController = keyringController
    this.pluginsController = pluginsController
    this.setupProvider = setupProvider
    this.pluginRestrictedMethods = pluginRestrictedMethods
    this.getApi = getApi
    this.metamaskEventMethods = metamaskEventMethods
    this._initializePermissions(restoredState)
  }

  createMiddleware (options) {
    const { origin, isPlugin } = options
    const engine = new JsonRpcEngine()
    engine.push(this.createPluginMethodRestrictionMiddleware(isPlugin))
    engine.push(this.createRequestMiddleware(options))
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
        res.error = rpcErrors.invalidRequest(null, req)
        return // TODO:json-rpc-engine
      }

      if (pluginRestrictedMethodsDescriptions[req.method] && !isPlugin) {
        res.error = rpcErrors.methodNotFound(null, req.method)
        return
      }

      return next()
    })
  }

  /**
   * Create middleware for preprocessing permissions requests.
   */
  createRequestMiddleware () {
    return createAsyncMiddleware(async (req, res, next) => {
      if (typeof req.method !== 'string') {
        res.error = rpcErrors.invalidRequest(null, req)
        return // TODO:json-rpc-engine
      }

      if (req.method.startsWith(INTERNAL_METHOD_PREFIX)) {
        switch (req.method.split(INTERNAL_METHOD_PREFIX)[1]) {
          case 'sendSiteMetadata':
            if (
              req.siteMetadata &&
              typeof req.siteMetadata.name === 'string'
            ) {
              this.memStore.putState({
                siteMetadata: {
                  ...this.memStore.getState().siteMetadata,
                  [req.origin]: req.siteMetadata,
                },
              })
            }
            break
          default:
            res.error = rpcErrors.methodNotFound(null, req.method)
            break
        }
        if (!res.error) res.result = true
        return
      }

      return next()
    })
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

    // TODO:permissions stop persisting permissionsDescriptions and remove this line
    const initState = { ...restoredState, permissionsRequests: [] }

    this.testProfile = {
      name: 'Dan Finlay',
    }

    this.pendingApprovals = {}
    const api = this.getApi()

    const externalMethodsToAddToRestricted = {
      ...this.pluginRestrictedMethods,
      ...api,
      ...this.metamaskEventMethods,
      removePermissionsFor: this.removePermissionsFor.bind(this),
      getApprovedAccounts: this.getAccounts.bind(this),
    }

    const pluginRestrictedMethods = Object.keys(externalMethodsToAddToRestricted).reduce((acc, methodKey) => {
      const hasDescription = externalMethodsToAddToRestricted[methodKey];
      if (!hasDescription) {
        return acc;
      }
      return {
        ...acc,
        ['metamask_' + methodKey]: {
          description: pluginRestrictedMethodsDescriptions[methodKey] || methodKey,
          method: 'metamask_' + externalMethodsToAddToRestricted[methodKey],
        }
      }
    }, {})

    this.permissions = new RpcCap({

      // Supports passthrough methods:
      safeMethods: SAFE_METHODS,

      // optional prefix for internal methods
      methodPrefix: METHOD_PREFIX,

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

        'wallet_plugin_': {
          description: 'Connect to plugin $1, and install it if not available yet.',
          method: async (req, res, next, end, engine) => {
            try {
              const origin = req.method.substr(14)

              let prior = this.pluginsController.get(origin)
              if (!prior) {
                await this.pluginsController.add(origin)
              }

              // Here is where we would invoke the message on that plugin iff possible.
              const handler = this.pluginsController.rpcMessageHandlers.get(origin)
              if (!handler) {
                res.error = rpcErrors.methodNotFound(null, req.method)
                return end(res.error)
              }

              const requestor = engine.domain

              // Handler is an async function that takes an origin string and a request object.
              // It should return the result it would like returned to the reqeustor as part of response.result
              res.result = await handler(requestor, req)
              return end()

            } catch (err) {
              res.error = err;
              return end(err)
            }
          }
        },

        'eth_addPlugin_*': {
          description: 'Install plugin $1, which will download new functionality to MetaMask from $2.',
          method: async (req, res, next, end) => {
            const pluginNameMatch = req.method.match(/eth_addPlugin_(.+)/)
            const pluginName = pluginNameMatch && pluginNameMatch[1]
            const sourceUrl = req.params[0].sourceUrl

            const response = await this.pluginsController.add(pluginName, sourceUrl)
            return response
          },
        },
        'eth_runPlugin_*': {
          description: 'Run plugin $1, which will be able to do the following:',
          method: async (req, res, next, end) => {
            const pluginNameMatch = req.method.match(/eth_runPlugin_(.+)/)
            const pluginName = pluginNameMatch && pluginNameMatch[1]

            const { requestedPermissions, sourceCode, ethereumProvider } = req.params[0]
            const result = await this.pluginsController.run(pluginName, requestedPermissions, sourceCode, ethereumProvider)
            res.result = result
            return end()
          },
        },

        ...pluginRestrictedMethods,
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
        },
        // TODO: This should be persisted/restored state.
        {})

        // TODO: Attenuate requested permissions in approval screen.
        // Like selecting the account to display.
      },
    }, initState)
  }

}

module.exports = {
  PermissionsController,
  addInternalMethodPrefix: prefix,
}
