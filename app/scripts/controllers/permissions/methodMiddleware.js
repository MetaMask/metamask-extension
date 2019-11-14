
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const { ethErrors } = require('eth-json-rpc-errors')

/**
 * Create middleware for handling certain methods and preprocessing permissions requests.
 */
module.exports = function createMethodMiddleware ({
  store, storeKey, getAccounts, requestAccountsPermission,
}) {
  return createAsyncMiddleware(async (req, res, next) => {

    if (typeof req.method !== 'string') {
      res.error = ethErrors.rpc.invalidRequest({ data: req})
      return
    }

    switch (req.method) {

      // intercepting eth_accounts requests for backwards compatibility,
      // i.e. return an empty array instead of an error
      case 'eth_accounts':

        res.result = await getAccounts()
        return

      case 'eth_requestAccounts':

        // first, just try to get accounts
        let accounts = await getAccounts()
        if (accounts.length > 0) {
          res.result = accounts
          return
        }

        // if no accounts, request the accounts permission
        try {
          await requestAccountsPermission()
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

      // custom method for getting metadata from the requesting domain
      case 'wallet_sendDomainMetadata':

        const storeState = store.getState()[storeKey]
        const extensionId = storeState[req.origin]
          ? storeState[req.origin].extensionId
          : undefined

        if (
          req.domainMetadata &&
          typeof req.domainMetadata.name === 'string'
        ) {

          store.updateState({
            [storeKey]: {
              ...storeState,
              [req.origin]: {
                extensionId,
                ...req.domainMetadata,
              },
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
