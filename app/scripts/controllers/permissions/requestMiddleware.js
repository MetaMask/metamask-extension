
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const { ethErrors } = require('eth-json-rpc-errors')

/**
 * Create middleware for preprocessing permissions requests.
 */
module.exports = function createRequestMiddleware ({
  store, storeKey, getAccounts
}) {
  return createAsyncMiddleware(async (req, res, next) => {

    if (typeof req.method !== 'string') {
      res.error = ethErrors.rpc.invalidRequest({ data: req})
      return
    }

    switch (req.method) {
      // intercepting eth_accounts requests for backwards compatibility,
      // i.e. return an empty array instead of error
      case 'eth_accounts':
        res.result = await getAccounts(req.origin)
        return

      // custom method for getting metadata from the requesting domain
      case 'wallet_sendDomainMetadata':
        if (
          req.domainMetadata &&
          typeof req.domainMetadata.name === 'string'
        ) {
          store.updateState({
            [storeKey]: {
              ...store.getState()[storeKey],
              [req.origin]: req.domainMetadata,
            },
          })
        }
        res.result = true
        return

      default:
        break
    }

    next()
  })
}
