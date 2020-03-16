import createAsyncMiddleware from 'json-rpc-engine/src/createAsyncMiddleware'
import { ethErrors } from 'eth-json-rpc-errors'

/**
 * Create middleware for handling certain methods and preprocessing permissions requests.
 */
export default function createMethodMiddleware ({
  store, storeKey, getAccounts, requestAccountsPermission,
}) {
  return createAsyncMiddleware(async (req, res, next) => {

    switch (req.method) {

      // Intercepting eth_accounts requests for backwards compatibility:
      // The getAccounts call below wraps the rpc-cap middleware, and returns
      // an empty array in case of errors (such as 4100:unauthorized)
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
        /* istanbul ignore else: too hard to induce, see below comment */
        if (accounts.length > 0) {
          res.result = accounts
        } else {
          // this should never happen, because it should be caught in the
          // above catch clause
          res.error = ethErrors.rpc.internal(
            'Accounts unexpectedly unavailable. Please report this bug.'
          )
        }

        return

      // custom method for getting metadata from the requesting domain,
      // sent automatically by the inpage provider
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
