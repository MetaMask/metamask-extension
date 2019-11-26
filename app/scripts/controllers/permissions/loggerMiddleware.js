
const clone = require('clone')
const { isValidAddress } = require('ethereumjs-util')

const LOG_LIMIT = 100

/**
 * Create middleware for logging requests and responses to restricted and
 * permissions-related methods.
 */
module.exports = function createLoggerMiddleware ({
  walletPrefix, restrictedMethods, store, logStoreKey, historyStoreKey, ignoreMethods,
}) {
  return (req, res, next, _end) => {
    let activityEntry, requestedMethods
    const { origin, method } = req
    const isInternal = method.startsWith(walletPrefix)
    if ((isInternal || restrictedMethods.includes(method)) && !ignoreMethods.includes(method)) {
      activityEntry = logActivity(req, isInternal)
      if (method === `${walletPrefix}requestPermissions`) {
        requestedMethods = getRequestedMethods(req)
      }
    } else if (method === 'eth_requestAccounts') {
      activityEntry = logActivity(req, isInternal)
      requestedMethods = [ 'eth_accounts' ]
    } else {
      return next()
    }

    next(cb => {
      const time = Date.now()
      addResponse(activityEntry, res, time)
      if (!res.error && requestedMethods) {
        logHistory(requestedMethods, origin, res.result, time, method === 'eth_requestAccounts')
      }
      cb()
    })
  }

  function logActivity (request, isInternal) {
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
    commitActivity(activityEntry)
    return activityEntry
  }

  function addResponse (activityEntry, response, time) {
    if (!response) {
      return
    }
    activityEntry.response = cloneObj(response)
    activityEntry.responseTime = time
    activityEntry.success = !response.error
  }

  function commitActivity (entry) {
    const logs = store.getState()[logStoreKey]
    if (logs.length > LOG_LIMIT - 2) {
      logs.pop()
    }
    logs.push(entry)
    store.updateState({ [logStoreKey]: logs })
  }

  function getRequestedMethods (request) {
    if (
      !request.params ||
      typeof request.params[0] !== 'object' ||
      Array.isArray(request.params[0])
    ) {
      return null
    }
    return Object.keys(request.params[0])
  }

  function logHistory (requestedMethods, origin, result, time, isEthRequestAccounts) {
    let accounts, entries
    if (isEthRequestAccounts) {
      accounts = result
      const accountToTimeMap = accounts.reduce((acc, account) => ({ ...acc, [account]: time }), {})
      entries = { 'eth_accounts': { accounts: accountToTimeMap, lastApproved: time } }
    } else {
      entries = result
        ? result
          .map(perm => {
            if (perm.parentCapability === 'eth_accounts') {
              accounts = getAccountsFromPermission(perm)
            }
            return perm.parentCapability
          })
          .reduce((acc, m) => {
            if (requestedMethods.includes(m)) {
              if (m === 'eth_accounts') {
                const accountToTimeMap = accounts.reduce((acc, account) => ({ ...acc, [account]: time }), {})
                acc[m] = { lastApproved: time, accounts: accountToTimeMap }
              } else {
                acc[m] = { lastApproved: time }
              }
            }
            return acc
          }, {})
        : {}
    }

    if (Object.keys(entries).length > 0) {
      commitHistory(origin, entries)
    }
  }

  function commitHistory (origin, entries) {
    const history = store.getState()[historyStoreKey] || {}
    const newOriginHistory = {
      ...history[origin],
      ...entries,
    }

    if (history[origin] && history[origin]['eth_accounts'] && entries['eth_accounts']) {
      newOriginHistory['eth_accounts'] = {
        lastApproved: entries['eth_accounts'].lastApproved,
        accounts: {
          ...history[origin]['eth_accounts'].accounts,
          ...entries['eth_accounts'].accounts,
        },
      }
    }

    history[origin] = newOriginHistory

    store.updateState({ [historyStoreKey]: history })
  }
}

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

function getAccountsFromPermission (perm) {
  if (perm.parentCapability !== 'eth_accounts' || !perm.caveats) {
    return []
  }
  const accounts = {}
  for (const c of perm.caveats) {
    if (c.type === 'filterResponse' && Array.isArray(c.value)) {
      for (const v of c.value) {
        if (isValidAddress(v)) {
          accounts[v] = true
        }
      }
    }
  }
  return Object.keys(accounts)
}
