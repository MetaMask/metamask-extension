
import { cloneDeep } from 'lodash'
import { isValidAddress } from 'ethereumjs-util'
import {
  CAVEAT_NAMES,
  HISTORY_STORE_KEY,
  LOG_STORE_KEY,
  LOG_IGNORE_METHODS,
  WALLET_PREFIX,
} from './enums'

const LOG_LIMIT = 100

/**
 * Controller with middleware for logging requests and responses to restricted
 * and permissions-related methods.
 */
export default class PermissionsLogController {

  constructor ({ restrictedMethods, store }) {
    this.restrictedMethods = restrictedMethods
    this.store = store
  }

  /**
   * Get the activity log.
   *
   * @returns {Array<Object>} - The activity log.
   */
  getActivityLog () {
    return this.store.getState()[LOG_STORE_KEY] || []
  }

  /**
   * Update the activity log.
   *
   * @param {Array<Object>} logs - The new activity log array.
   */
  updateActivityLog (logs) {
    this.store.updateState({ [LOG_STORE_KEY]: logs })
  }

  /**
   * Get the permissions history log.
   *
   * @returns {Object} - The permissions history log.
   */
  getHistory () {
    return this.store.getState()[HISTORY_STORE_KEY] || {}
  }

  /**
   * Update the permissions history log.
   *
   * @param {Object} history - The new permissions history log object.
   */
  updateHistory (history) {
    this.store.updateState({ [HISTORY_STORE_KEY]: history })
  }

  /**
   * Updates the exposed account history for the given origin.
   * Sets the 'last seen' time to Date.now() for the given accounts.
   *
   * @param {string} origin - The origin that the accounts are exposed to.
   * @param {Array<string>} accounts - The accounts.
   */
  updateAccountsHistory (origin, accounts) {

    if (accounts.length === 0) {
      return
    }

    const accountToTimeMap = getAccountToTimeMap(accounts, Date.now())

    this.commitNewHistory(origin, {
      eth_accounts: {
        accounts: accountToTimeMap,
      },
    })
  }

  /**
   * Create a permissions log middleware.
   *
   * @returns {JsonRpcEngineMiddleware} - The permissions log middleware.
   */
  createMiddleware () {
    return (req, res, next, _end) => {

      let requestedMethods
      const { origin, method, id: requestId } = req
      const isInternal = method.startsWith(WALLET_PREFIX)

      // we only log certain methods
      if (
        !LOG_IGNORE_METHODS.includes(method) &&
        (isInternal || this.restrictedMethods.includes(method))
      ) {

        this.logActivityRequest(req, isInternal)

        if (method === `${WALLET_PREFIX}requestPermissions`) {
          // get the corresponding methods from the requested permissions
          requestedMethods = this.getRequestedMethods(req)
        }
      } else if (method === 'eth_requestAccounts') {

        // eth_requestAccounts is a special case; we need to extract the accounts
        // from it
        this.logActivityRequest(req, isInternal)
        requestedMethods = [ 'eth_accounts' ]
      } else {
        // no-op
        return next()
      }

      // call next with a return handler for capturing the response
      next(cb => {

        const time = Date.now()
        this.logActivityResponse(requestId, res, time)

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

  /**
   * Creates and commits an activity log entry, without response data.
   *
   * @param {Object} request - The request object.
   * @param {boolean} isInternal - Whether the request is internal.
   */
  logActivityRequest (request, isInternal) {
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
    this.commitNewActivity(activityEntry)
  }

  /**
   * Adds response data to an existing activity log entry and re-commits it.
   *
   * @param {string} id - The original request id.
   * @param {Object} response - The response object.
   * @param {number} time - Output from Date.now()
   */
  logActivityResponse (id, response, time) {

    if (!id || !response) {
      return
    }

    const logs = this.getActivityLog()
    const index = getLastIndexOfObjectArray(logs, 'id', id)
    if (index === -1) {
      return
    }

    const entry = logs[index]
    entry.response = cloneObj(response)
    entry.responseTime = time
    entry.success = !response.error

    this.updateActivityLog(logs)
  }

  /**
   * Commit a new entry to the activity log.
   * Removes the oldest entry from the log if it exceeds the log limit.
   *
   * @param {Object} entry - The activity log entry.
   */
  commitNewActivity (entry) {

    const logs = this.getActivityLog()

    // add new entry to end of log
    logs.push(entry)

    // remove oldest log if exceeding size limit
    if (logs.length > LOG_LIMIT) {
      logs.shift()
    }

    this.updateActivityLog(logs)
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
      this.commitNewHistory(origin, newEntries)
    }
  }

  /**
   * Commit new entries to the permissions history log.
   * Merges the history for the given origin, overwriting existing entries
   * with the same key (permission name).
   *
   * @param {string} origin - The requesting origin.
   * @param {Object} newEntries - The new entries to commit.
   */
  commitNewHistory (origin, newEntries) {

    // a simple merge updates most permissions
    const history = this.getHistory()
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

    this.updateHistory(history)
  }

  /**
   * Get all requested methods from a permissions request.
   *
   * @param {Object} request - The request object.
   * @returns {Array<string>} - The names of the requested permissions.
   */
  getRequestedMethods (request) {
    if (
      !request.params ||
      !request.params[0] ||
      typeof request.params[0] !== 'object' ||
      Array.isArray(request.params[0])
    ) {
      return null
    }
    return Object.keys(request.params[0])
  }

  /**
   * Get the permitted accounts from an eth_accounts permissions object.
   * Returns an empty array if the permission is not eth_accounts.
   *
   * @param {Object} perm - The permissions object.
   * @returns {Array<string>} - The permitted accounts.
   */
  getAccountsFromPermission (perm) {

    if (perm.parentCapability !== 'eth_accounts' || !perm.caveats) {
      return []
    }

    const accounts = {}
    for (const caveat of perm.caveats) {

      if (
        caveat.name === CAVEAT_NAMES.exposedAccounts &&
        Array.isArray(caveat.value)
      ) {

        for (const value of caveat.value) {
          if (isValidAddress(value)) {
            accounts[value] = true
          }
        }
      }
    }
    return Object.keys(accounts)
  }
}

// helper functions

// the call to clone is set to disallow circular references
// we attempt cloning at a depth of 3 and 2, then return a
// shallow copy of the object
function cloneObj (obj) {

  for (let i = 3; i > 1; i--) {
    try {
      return cloneDeep(obj, false, i)
    } catch (_) {}
  }
  return { ...obj }
}

function getAccountToTimeMap (accounts, time) {
  return accounts.reduce(
    (acc, account) => ({ ...acc, [account]: time }), {}
  )
}

function getLastIndexOfObjectArray (array, key, value) {

  if (Array.isArray(array) && array.length > 0) {

    for (let i = array.length - 1; i >= 0; i--) {

      if (!array[i] || typeof array[i] !== 'object') {
        throw new Error(`Encountered non-Object element at index ${i}`)
      }

      if (array[i][key] === value) {
        return i
      }
    }
  }
  return -1
}
