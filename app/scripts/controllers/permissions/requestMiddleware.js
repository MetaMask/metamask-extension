
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const { errors: rpcErrors } = require('eth-json-rpc-errors')

/**
 * Create middleware for preprocessing permissions requests.
 */
module.exports = function createRequestMiddleware ({
  internalPrefix, store, storeKey,
}) {
  return createAsyncMiddleware(async (req, res, next) => {

    if (typeof req.method !== 'string') {
      res.error = rpcErrors.invalidRequest(null, req)
      return
    }

    if (req.method.startsWith(internalPrefix)) {
      switch (req.method.split(internalPrefix)[1]) {
        case 'sendSiteMetadata':
          if (
            req.siteMetadata &&
            typeof req.siteMetadata.name === 'string'
          ) {
            store.updateState({
              [storeKey]: {
                ...store.getState()[storeKey],
                [req.origin]: req.siteMetadata,
              },
            })
          }
          res.result = true
          return
        default:
          break
      }
    }

    return next()
  })
}
