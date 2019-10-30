
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const { errors: rpcErrors } = require('eth-json-rpc-errors')

/**
 * Create middleware for preprocessing permissions requests.
 */
module.exports = function createRequestMiddleware ({
  store, storeKey,
}) {
  return createAsyncMiddleware(async (req, res, next) => {

    if (typeof req.method !== 'string') {
      res.error = rpcErrors.invalidRequest(null, req)
      return
    }

    const prefix = 'wallet_'
    if (req.method.startsWith(prefix)) {
      switch (req.method.split(prefix)[1]) {
        case 'sendDomainMetadata':
          if (
            req.siteMetadata &&
            typeof req.domainMetadata.name === 'string'
          ) {
            addDomainMetadata(req.origin, req.domainMetadata)
          }
          res.result = true
          return
        default:
          break
      }
    // plugins are handled here
    // TODO:plugin handle this better, rename siteMetadata to domainMetadata everywhere
    } else if (
      req.origin !== 'MetaMask' &&
      !getOwnState().hasOwnProperty(req.origin)
    ) {
      let name = 'Unknown Domain'
      try {
        name = new URL(req.origin).hostname
      } catch (err) {} // noop
      addDomainMetadata(req.origin, { name })
    }

    return next()
  })

  function addDomainMetadata (origin, metadata) {
    store.updateState({
      [storeKey]: {
        ...getOwnState(),
        [origin]: metadata,
      },
    })
  }

  function getOwnState () {
    return store.getState()[storeKey]
  }
}
