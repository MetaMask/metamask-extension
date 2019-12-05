
const clone = require('clone')
const { isValidAddress } = require('ethereumjs-util')
const { CAVEAT_NAMES } = require('./enums')

const LOG_LIMIT = 100

const getAccountToTimeMap = (accounts, time) => accounts.reduce(
  (acc, account) => ({ ...acc, [account]: time }), {}
)

/**
 * Create middleware for logging requests and responses to restricted and
 * permissions-related methods.
 */
class PermissionsLogController {

  constructor ({
    walletPrefix, restrictedMethods, store,
    logStoreKey, historyStoreKey, ignoreMethods,
  }) {
    this.walletPrefix = walletPrefix
    this.restrictedMethods = restrictedMethods
    this.store = store
    this.logStoreKey = logStoreKey
    this.historyStoreKey = historyStoreKey
    this.ignoreMethods = ignoreMethods
  }

  getLogStore () {
    return this.store.getState()[this.logStoreKey] || []
  }

  updateLogStore (logs) {
    this.store.updateState({ [this.logStoreKey]: logs })
  }

  getHistoryStore () {
    return this.store.getState()[this.logStoreKey] || {}
  }

  updateHistoryStore (history) {
    this.store.updateState({ [this.historyStoreKey]: history })
  }

  createMiddleware () {
    return (req, res, next, _end) => {

      let activityEntry, requestedMethods
      const { origin, method } = req
      const isInternal = method.startsWith(this.walletPrefix)

      // we only log certain methods
      if (
        (isInternal || this.restrictedMethods.includes(method)) &&
        !this.ignoreMethods.includes(method)
      ) {

        activityEntry = this.logActivity(req, isInternal)

        if (method === `${this.walletPrefix}requestPermissions`) {
          // get the corresponding methods from the requested permissions
          requestedMethods = this.getRequestedMethods(req)
        }
      } else if (method === 'eth_requestAccounts') {

        // eth_requestAccounts is a special case; we need to extract the accounts
        // from it
        activityEntry = this.logActivity(req, isInternal)
        requestedMethods = [ 'eth_accounts' ]
      } else {
        // no-op
        return next()
      }

      // call next with a return handler for capturing the response
      next(cb => {

        const time = Date.now()
        this.addResponse(activityEntry, res, time)

        if (!res.error && requestedMethods) {
          // any permissions or accounts changes will be recorded on the response,
          // so we only log permissions history here
          this.logPermissionsHistory(
            requestedMethods, origin, res.result, time,
            method === 'eth_requestAccounts',
          )
        }
        cb()
      })
    }
  }

  // creates and commits an activity log entry, without response data
  logActivity (request, isInternal) {
    const activityEntry = {
      id: request.id,
      method: request.method,
      methodType: isInternal ? 'internal' : 'restricted',
      origin: request.origin,
      request: cloneObj(request),
      requestTime: Date.now(),
      response: null,
      responseTime: null,
      success: null,
    }
    this.commitActivity(activityEntry)
    return activityEntry
  }

  // adds response data to an activity entry
  addResponse (activityEntry, response, time) {
    if (!response) {
      return
    }
    activityEntry.response = cloneObj(response)
    activityEntry.responseTime = time
    activityEntry.success = !response.error
  }

  // get requested methods from a permissions request
  getRequestedMethods (request) {
    if (
      !request.params ||
      typeof request.params[0] !== 'object' ||
      Array.isArray(request.params[0])
    ) {
      return null
    }
    return Object.keys(request.params[0])
  }


  getAccountsFromPermission (perm) {

    if (perm.parentCapability !== 'eth_accounts' || !perm.caveats) {
      return []
    }

    const accounts = {}
    for (const c of perm.caveats) {
      if (c.name === CAVEAT_NAMES.exposedAccounts && Array.isArray(c.value)) {
        for (const v of c.value) {
          if (isValidAddress(v)) {
            accounts[v] = true
          }
        }
      }
    }
    return Object.keys(accounts)
  }

  // commit an activity entry to the log
  commitActivity (entry) {

    const logs = this.getLogStore()

    // add new entry to end of log
    logs.push(entry)

    // remove oldest log if exceeding size limit
    if (logs.length > LOG_LIMIT) {
      logs.shift()
    }

    this.updateLogStore()
  }

  /**
   * Create new permissions history log entries, if any, and commit them.
   *
   * @param {Array<string>} requestedMethods - The method names corresponding to the requested permissions.
   * @param {string} origin - The origin of the permissions request.
   * @param {Array<IOcapLdCapability} result - The permissions request response.result.
   * @param {string} time - The time of the request, i.e. Date.now().
   * @param {boolean} isEthRequestAccounts - Whether the permissions request was 'eth_requestAccounts'.
   */
  logPermissionsHistory (requestedMethods, origin, result, time, isEthRequestAccounts) {

    let accounts, newEntries

    if (isEthRequestAccounts) {

      accounts = result
      const accountToTimeMap = getAccountToTimeMap(accounts, time)

      newEntries = {
        'eth_accounts': {
          accounts: accountToTimeMap,
          lastApproved: time,
        },
      }

    } else {

      // Records new "lastApproved" times for the granted permissions, if any.
      // Special handling for eth_accounts, in order to record the time the
      // accounts were last seen or approved by the origin.
      newEntries = result
        ? result
          .map(perm => {

            if (perm.parentCapability === 'eth_accounts') {
              accounts = this.getAccountsFromPermission(perm)
            }

            return perm.parentCapability
          })
          .reduce((acc, method) => {

            if (requestedMethods.includes(method)) {

              if (method === 'eth_accounts') {

                const accountToTimeMap = getAccountToTimeMap(accounts, time)

                acc[method] = {
                  lastApproved: time,
                  accounts: accountToTimeMap,
                }

              } else {
                acc[method] = { lastApproved: time }
              }
            }

            return acc
          }, {})
        : {} // no result (e.g. in case of error), no log
    }

    if (Object.keys(newEntries).length > 0) {
      this.commitHistory(origin, newEntries)
    }
  }

  updateAccountsHistory (origin, accounts) {

    if (accounts.length === 0) {
      return
    }

    const accountToTimeMap = getAccountToTimeMap(accounts, Date.now())

    this.commitHistory(origin, {
      eth_accounts: {
        accounts: accountToTimeMap,
      },
    })
  }

  // commit a history log entry
  commitHistory (origin, newEntries) {

    // a simple merge updates most permissions
    const history = this.getHistoryStore()
    const newOriginHistory = {
      ...history[origin],
      ...newEntries,
    }

    // eth_accounts requires special handling, because of information
    // we store about the accounts
    const existingEthAccountsEntry = (
      history[origin] && history[origin]['eth_accounts']
    )
    const newEthAccountsEntry = newEntries['eth_accounts']
    if (existingEthAccountsEntry && newEthAccountsEntry) {

      // we may intend to update just the accounts, not the permission
      // itself
      const lastApproved = (
        newEthAccountsEntry.lastApproved ||
        existingEthAccountsEntry.lastApproved
      )

      // merge old and new eth_accounts history entries
      newOriginHistory['eth_accounts'] = {
        lastApproved,
        accounts: {
          ...existingEthAccountsEntry.accounts,
          ...newEthAccountsEntry.accounts,
        },
      }
    }

    history[origin] = newOriginHistory

    this.updateHistoryStore(history)
  }
}

// helper functions

// the call to clone is set to disallow circular references
// we attempt cloning at a depth of 3 and 2, then return a
// shallow copy of the object
function cloneObj (obj) {

  for (let i = 3; i > 1; i--) {
    try {
      return clone(obj, false, i)
    } catch (_) {}
  }
  return { ...obj }
}

module.exports = PermissionsLogController
