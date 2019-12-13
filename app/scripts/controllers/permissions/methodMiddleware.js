
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const { ethErrors } = require('eth-json-rpc-errors')
const { PLUGIN_PREFIX } = require('./enums')

/**
 * Middleware for preprocessing permission requests and outright handling
 * certain methods.
 *
 * Note: returning from an rpc-engine async middleware is like calling end()
 * in a non-async one; it returns the response to the client. Previously added
 * return handlers will still process it.
 */
module.exports = function createRequestMiddleware ({
  store, storeKey, getAccounts, requestPermissions, installPlugins,
}) {
  return createAsyncMiddleware(async (req, res, next) => {

    if (
      typeof req.method !== 'string'
    ) {
      res.error = ethErrors.rpc.invalidRequest({ data: req })
      return
    }

    switch (req.method) {

      // account-related methods

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
          res.result = await handleInstallPlugins(req.origin, req.params[0])
        } catch (err) {
          res.error = err
        }
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

      case 'wallet_getPlugins':

        // TODO
        return

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
        } catch (err) {
          // if this fails, reject the entire request
          res.error = err
          return
        }

        // install plugins, if any

        // get the names of the approved plugins
        const pluginPrefixRegex = new RegExp(`^${PLUGIN_PREFIX}`)
        const requestedPlugins = result.permissions
          // requestPermissions returns all permissions for the domain,
          // so we're filtering out non-plugin and existing permissions
          .filter(p => (
            p.parentCapability.startsWith(PLUGIN_PREFIX) &&
            p.parentCapability in requestedPermissions
          ))
          .map(p => p.parentCapability.replace(pluginPrefixRegex, ''))
          .reduce((acc, pluginName) => {
            acc[pluginName] = {}
            return acc
          }, {})

        console.log('requestedPlugins', requestedPlugins)

        try {
          if (Object.keys(requestedPlugins).length > 0) {
            // this throws if requestedPlugins is empty
            result.plugins = await handleInstallPlugins(
              req.origin, requestedPlugins
            )
          }
        } catch (err) {
          if (!result.errors) {
            result.errors = []
          }
          result.errors.push(err)
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
          addDomainMetadata(req.origin, req.domainMetadata)
        }

        res.result = true
        return

      // passthrough all other methods
      default:
        break
    }

    // try to infer some metadata for unknown domains, including plugins
    if (
      req.origin !== 'metamask' && (
        getOwnState() && !getOwnState()[req.origin]
      )
    ) {
      // plugin metadata is handled here for now
      // TODO:plugin handle this better, rename domainMetadata everywhere
      let name = 'Unknown Domain'
      try {
        name = new URL(req.origin).hostname
      } catch (err) {} // noop
      addDomainMetadata(req.origin, { name })
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

  // typechecks the requested plugins and passes them to the permissions
  // controller for installation
  async function handleInstallPlugins (origin, requestedPlugins) {

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

    return installPlugins(origin, requestedPlugins)
  }

  function addDomainMetadata (origin, metadata) {

    // extensionId added higher up the stack, preserve it if it exists
    const currentState = store.getState()[storeKey]
    if (currentState[origin] && currentState[origin].extensionId) {
      metadata.extensionId = currentState[origin].extensionId
    }

    store.updateState({
      [storeKey]: {
        ...currentState,
        [origin]: {
          ...metadata,
        },
      },
    })
  }

  function getOwnState () {
    return store.getState()[storeKey]
  }
}
