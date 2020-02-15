
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const { ethErrors, serializeError} = require('eth-json-rpc-errors')
const { PLUGIN_PREFIX, PLUGIN_PREFIX_REGEX } = require('./enums')

/**
 * Middleware for preprocessing permission requests and outright handling
 * certain methods.
 *
 * Note: returning from an rpc-engine async middleware is like calling end()
 * in a non-async one; it returns the response to the client. Previously added
 * return handlers will still process it.
 */
module.exports = function createRequestMiddleware ({
  origin, isPlugin, store, metadataStoreKey, getAccounts,
  requestPermissions, installPlugins, getPlugins,
}) {
  return createAsyncMiddleware(async (req, res, next) => {

    // defensive programming
    if (req.origin !== origin) {
      throw new Error('Fatal: Request origin does not match middleware origin.')
    }

    if (
      typeof req.method !== 'string'
    ) {
      res.error = ethErrors.rpc.invalidRequest({ data: req })
      return
    }

    switch (req.method) {

      // account-related methods

      // intercepting eth_accounts requests for backwards compatibility,
      // i.e. return an empty array instead of an error
      case 'eth_accounts':

        res.result = await getAccounts()
        return

      // completely handled here
      case 'eth_requestAccounts':

        // first, just try to get accounts
        let accounts = await getAccounts()
        if (accounts.length > 0) {
          res.result = accounts
          return
        }

        // if no accounts, request the accounts permission
        try {
          await requestPermissions({ eth_accounts: {} })
        } catch (err) {
          res.error = err
          return
        }

        // get the accounts again
        accounts = await getAccounts()
        if (accounts.length > 0) {
          res.result = accounts
        } else {
          // this should never happen
          res.error = ethErrors.rpc.internal(
            'Accounts unexpectedly unavailable. Please report this bug.'
          )
        }
        return

      // not handled here, just preprocessed to support some syntactic sugar,
      // specifically 'wallet_plugin'
      case 'wallet_requestPermissions':

        if (!Array.isArray(req.params)) {
          res.error = ethErrors.rpc.invalidParams({ data: req })
          return
        }

        try {
          req.params[0] = await preprocessRequestPermissions(req.params[0])
          break
        } catch (err) {
          res.error = err
          return
        }

        // plugin-related methods

      // completely handled here
      case 'wallet_installPlugins':

        if (!Array.isArray(req.params)) {
          res.error = ethErrors.rpc.invalidParams({ data: req })
          return
        }

        try {
          res.result = await handleInstallPlugins(req.params[0])
        } catch (err) {
          res.error = err
        }
        return

      // returns permitted and installed plugins to the caller
      case 'wallet_getPlugins':

        // getPlugins is already bound to the origin
        res.result = getPlugins()
        return

      // basically syntactic sugar for calling a plugin RPC method
      // we preprocess and forward the request for completion elsewhere
      case 'wallet_invokePlugin':

        if (
          !Array.isArray(req.params) ||
          typeof req.params[0] !== 'string' ||
          typeof req.params[1] !== 'object' ||
          Array.isArray(req.params[1])
        ) {
          res.error = ethErrors.rpc.invalidParams({ data: req })
          return
        }

        req.method = PLUGIN_PREFIX + req.params[0]
        req.params = [ req.params[1] ]
        break

      // a convenience method combining:
      // - wallet_requestPermissions
      // - wallet_installPlugins
      // - eth_accounts (effectively, by parsing returned permissions)
      case 'wallet_enable':

        if (!Array.isArray(req.params)) {
          res.error = ethErrors.rpc.invalidParams({ data: req })
          return
        }

        const result = {
          accounts: [],
          permissions: [],
          plugins: {},
        }

        // request the permissions

        let requestedPermissions
        try {
          // we expect the params to be the same as wallet_requestPermissions
          requestedPermissions = await preprocessRequestPermissions(
            req.params[0]
          )
          result.permissions = await requestPermissions(requestedPermissions)
          if (!result.permissions || !result.permissions.length) {
            throw ethErrors.provider.userRejectedRequest({ data: req })
          }
        } catch (err) {
          // if this fails, reject the entire request
          res.error = err
          return
        }

        // install plugins, if any

        // get the names of the approved plugins
        const requestedPlugins = result.permissions
          // requestPermissions returns all permissions for the domain,
          // so we're filtering out non-plugin and preexisting permissions
          .filter(p => (
            p.parentCapability.startsWith(PLUGIN_PREFIX) &&
            p.parentCapability in requestedPermissions
          ))
          // convert from namespaced permissions to plugin names
          .map(p => p.parentCapability.replace(PLUGIN_PREFIX_REGEX, ''))
          .reduce((acc, pluginName) => {
            acc[pluginName] = {}
            return acc
          }, {})

        console.log('requestedPlugins', requestedPlugins)

        try {
          if (Object.keys(requestedPlugins).length > 0) {
            // this throws if requestedPlugins is empty
            result.plugins = await handleInstallPlugins(requestedPlugins)
          }
        } catch (err) {
          if (!result.errors) {
            result.errors = []
          }
          result.errors.push(serializeError(err))
        }

        // get whatever accounts we have
        result.accounts = await getAccounts()

        // return the result
        res.result = result
        return

        // miscellaneous methods

      // we received metadata about the requesting domain from its provider
      case 'wallet_sendDomainMetadata':

        if (
          req.domainMetadata &&
          typeof req.domainMetadata.name === 'string'
        ) {
          saveDomainMetadata(req.domainMetadata)
        }

        res.result = true
        return

      // passthrough all other methods
      default:
        break
    }

    // try to infer some metadata for unknown domains, including plugins
    const metadataState = getMetadataState()
    if (
      origin !== 'metamask' && (
        metadataState && metadataState[origin]
      )
    ) {
      let name = 'Unknown Domain'
      if (isPlugin) {
        // TODO:plugins add plugin metadata on install, probably
        name = 'Plugin: ' + origin
      } else {
        try {
          name = new URL(origin).hostname
        } catch (err) {} // noop
      }
      saveDomainMetadata({ name })
    }

    // if we make it here, continue down the middleware stack
    return next()
  })

  // helper functions

  // preprocess requested permissions to support 'wallet_plugin' syntactic sugar
  async function preprocessRequestPermissions (requestedPermissions) {

    if (
      typeof requestedPermissions !== 'object' ||
      Array.isArray(requestedPermissions)
    ) {
      throw ethErrors.rpc.invalidRequest({ data: { requestedPermissions } })
    }

    // passthrough if 'wallet_plugin' is not requested
    if (!requestedPermissions['wallet_plugin']) {
      return requestedPermissions
    }

    // rewrite permissions request parameter by destructuring plugins into
    // proper permissions prefixed with 'wallet_plugin_'
    return Object.keys(requestedPermissions).reduce((acc, permName) => {

      if (permName === 'wallet_plugin') {

        if (
          typeof (requestedPermissions[permName]) !== 'object' ||
          Array.isArray(requestedPermissions[permName])
        ) {
          throw ethErrors.rpc.invalidParams({
            message: `Invalid params to 'wallet_requestPermissions'`,
            data: { requestedPermissions },
          })
        }

        const requestedPlugins = requestedPermissions[permName]

        // destructure 'wallet_plugin' object
        Object.keys(requestedPlugins).forEach(pluginName => {

          const pluginKey = PLUGIN_PREFIX + pluginName

          // disallow requesting a plugin X under 'wallet_plugins' and
          // directly as 'wallet_plugin_X'
          if (requestedPermissions[pluginKey]) {
            throw ethErrors.rpc.invalidParams({
              message: `Plugin '${pluginName}' requested both as direct permission and under 'wallet_plugin'. We recommend using 'wallet_plugin' only.`,
              data: { requestedPermissions },
            })
          }

          acc[pluginKey] = requestedPlugins[pluginName]
        })
      } else {

        // otherwise, leave things as we found them
        acc[permName] = requestedPermissions[permName]
      }

      return acc
    }, {})
  }

  /**
   * Typechecks the requested plugins and passes them to the permissions
   * controller for installation.
   */
  async function handleInstallPlugins (requestedPlugins) {

    // input validation
    // we expect requestedPlugins to be an object of the form:
    // { pluginName1: {}, pluginName2: {}, ... }
    // the object values are placeholders
    if (
      typeof requestedPlugins !== 'object' ||
      Array.isArray(requestedPlugins)
    ) {
      throw ethErrors.rpc.invalidParams({
        message: `Invalid params to 'wallet_installPlugins'`,
        data: { requestedPlugins },
      })
    } else if (Object.keys(requestedPlugins).length === 0) {
      throw ethErrors.rpc.invalidParams({
        message: `Must request at least one plugin when calling 'wallet_installPlugins'`,
        data: { requestedPlugins },
      })
    }

    // installPlugins is bound to the origin
    return installPlugins(requestedPlugins)
  }

  /**
   * Saves the metadata for this middleware's origin.
   *
   * @param {Object} metadata - The metadata.
   */
  function saveDomainMetadata (metadata) {

    // extensionId added higher up the stack, preserve it if it exists
    const currentState = store.getState()[metadataStoreKey]
    if (currentState[origin] && currentState[origin].extensionId) {
      metadata.extensionId = currentState[origin].extensionId
    }

    store.updateState({
      [metadataStoreKey]: {
        ...currentState,
        [origin]: {
          ...metadata,
        },
      },
    })
  }

  /**
   * Get the state managed by this middleware.
   */
  function getMetadataState () {
    return store.getState()[metadataStoreKey]
  }
}
