import { ethErrors, ERROR_CODES } from 'eth-json-rpc-errors'
import { cloneDeep } from 'lodash'
import EventEmitter from 'events'

import {
  PermissionsController,
} from '../../../../../app/scripts/controllers/permissions'

import _getRestrictedMethods
  from '../../../../../app/scripts/controllers/permissions/restrictedMethods'

import {
  CAVEAT_NAMES,
  NOTIFICATION_NAMES,
} from '../../../../../app/scripts/controllers/permissions/enums'

export const noop = () => {}

export const keyringAccounts = [
  '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
]

export const DUMMY_ACCOUNT = '0xabc'

const platform = {
  openExtensionInBrowser: noop,
}

async function getKeyringAccounts () {
  return keyringAccounts
}

export function getPermController (
  notifyDomain = noop,
  notifyAllDomains = noop,
) {
  return new PermissionsController({
    platform,
    getKeyringAccounts,
    notifyDomain,
    notifyAllDomains,
    getRestrictedMethods,
  })
}

export const getNotifyDomain = (notifications = {}) => (origin, notification) => {
  notifications[origin].push(notification)
}

export const getNotifyAllDomains = (notifications = {}) => (notification) => {
  Object.keys(notifications).forEach((origin) => {
    notifications[origin].push(notification)
  })
}

export function getEventEmitter () {
  return new EventEmitter()
}

export function grantPermissions (permController, origin, permissions) {
  permController.permissions.grantNewPermissions(
    origin, permissions, {}, noop
  )
}

// returns a Promise-wrapped middleware function with convenient default args
export function getPermissionsMiddleware (permController, origin, extensionId) {
  const middleware = permController.createMiddleware({ origin, extensionId })
  return (req, res = {}, next = noop, end) => {
    return new Promise((resolve, reject) => {

      end = end || _end

      middleware(req, res, next, end)

      // emulates json-rpc-engine error handling
      function _end (err) {
        if (err || res.error) {
          reject(err || res.error)
        } else {
          resolve(res)
        }
      }
    })
  }
}

export const getApprovedPermissionsRequest = (id, permissions = {}) => {
  return {
    permissions,
    metadata: { id },
  }
}

export const REQUEST_IDS = {
  a: '1',
  b: '2',
  c: '3',
}

export const ORIGINS = {
  a: 'foo.xyz',
  b: 'bar.abc',
  c: 'baz.def',
}

export const ACCOUNT_ARRAYS = {
  metamask: [],
  a: keyringAccounts,
  b: [keyringAccounts[0]],
  c: [keyringAccounts[1]],
}

export const CAVEATS = {
  eth_accounts: (accounts) => {
    return {
      type: 'filterResponse',
      value: accounts,
      name: CAVEAT_NAMES.exposedAccounts,
    }
  },
}

export const PERM_NAMES = {
  eth_accounts: 'eth_accounts',
  test_method: 'test_method',
}

export const PERMS = {

  internalMethods: {
    request: 'wallet_requestPermissions',
  },

  requests: {
    eth_accounts: () => {
      return { eth_accounts: {} }
    },
    test_method: () => {
      return { test_method: {} }
    },
    does_not_exist: () => {
      return { does_not_exist: {} }
    },
  },

  finalizedRequests: {
    eth_accounts: (accounts) => {
      return {
        eth_accounts: {
          caveats: [CAVEATS.eth_accounts(accounts)],
        } }
    },

    test_method: () => {
      return {
        test_method: {},
      }
    },
  },

  /** i.e. members of res.result for successful:
   * - wallet_requestPermissions
   * - wallet_getPermissions
   */
  granted: {
    eth_accounts: (accounts) => {
      return {
        parentCapability: PERM_NAMES.eth_accounts,
        caveats: [CAVEATS.eth_accounts(accounts)],
      }
    },

    test_method: () => {
      return {
        parentCapability: PERM_NAMES.test_method,
      }
    },
  },
}

export const NOTIFICATIONS = {

  removedAccounts: () => {
    return {
      method: NOTIFICATION_NAMES.accountsChanged,
      result: [],
    }
  },

  newAccounts: (accounts) => {
    return {
      method: NOTIFICATION_NAMES.accountsChanged,
      result: accounts,
    }
  },

  test: () => {
    return {
      method: 'test_notification',
      result: true,
    }
  },
}

export const ERRORS = {

  validatePermittedAccounts: {

    invalidParam: () => {
      return {
        name: 'Error',
        message: 'Must provide non-empty array of account(s).',
      }
    },

    nonKeyringAccount: (account) => {
      return {
        name: 'Error',
        message: `Unknown account: ${account}`,
      }
    },
  },

  finalizePermissionsRequest: {
    grantEthAcountsFailure: (origin) => {
      return {
        // name: 'EthereumRpcError',
        message: `Failed to add 'eth_accounts' to '${origin}'.`,
        code: ERROR_CODES.rpc.internal,
      }
    },
  },

  updatePermittedAccounts: {
    invalidOrigin: () => {
      return {
        message: 'No such permission exists for the given domain.',
      }
    },
  },

  legacyExposeAccounts: {
    badOrigin: () => {
      return {
        message: 'Must provide non-empty string origin.',
      }
    },
    forbiddenUsage: () => {
      return {
        name: 'Error',
        message: 'May not call legacyExposeAccounts on origin with exposed accounts.',
      }
    },
  },

  handleNewAccountSelected: {
    invalidParams: () => {
      return {
        name: 'Error',
        message: 'Should provide non-empty origin and account strings.',
      }
    },
  },

  approvePermissionsRequest: {
    noPermsRequested: () => {
      return {
        message: 'Must request at least one permission.',
      }
    },
  },

  rejectPermissionsRequest: {
    rejection: () => {
      return {
        message: ethErrors.provider.userRejectedRequest().message,
      }
    },
  },

  createMiddleware: {
    badOrigin: () => {
      return {
        message: 'Must provide non-empty string origin.',
      }
    },
  },

  rpcCap: {
    unauthorized: () => {
      return {
        code: 4100,
      }
    },
  },

  logAccountExposure: {
    invalidParams: () => {
      return {
        message: 'Must provide non-empty string origin and array of accounts.',
      }
    },
  },
}

export const rpcRequests = {
  custom: (origin, method, params = [], id) => {
    const out = {
      origin,
      method,
      params,
    }
    if (id !== undefined) {
      out.id = id
    }
    return out
  },

  eth_accounts: (origin) => {
    return {
      origin,
      method: 'eth_accounts',
      params: [],
    }
  },

  test_method: (origin, param = false) => {
    return {
      origin,
      method: 'test_method',
      params: [param],
    }
  },

  eth_requestAccounts: (origin) => {
    return {
      origin,
      method: 'eth_requestAccounts',
      params: [],
    }
  },

  requestPermission: (origin, permissionName) => {
    return {
      origin,
      method: 'wallet_requestPermissions',
      params: [ PERMS.requests[permissionName]() ],
    }
  },

  requestPermissions: (origin, permissions = {}) => {
    return {
      origin,
      method: 'wallet_requestPermissions',
      params: [ permissions ],
    }
  },

  wallet_sendDomainMetadata: (origin, name, ...args) => {
    return {
      origin,
      method: 'wallet_sendDomainMetadata',
      domainMetadata: {
        ...args,
        name,
      },
    }
  },
}

export const restrictedMethods = [
  'eth_accounts',
  'test_method',
]

export function getRestrictedMethods (instance) {
  return {

    ..._getRestrictedMethods(instance),

    'test_method': {
      description: `This method is only for testing.`,
      method: (req, res, __, end) => {
        if (req.params[0]) {
          res.result = 1
        } else {
          res.result = 0
        }
        end()
      },
    },
  }
}

export function getRequestLogEntry (request, isInternal) {
  return {
    id: request.id,
    method: request.method,
    methodType: isInternal ? 'internal' : 'restricted',
    origin: request.origin,
    request: cloneDeep(request),
    requestTime: Date.now(),
    response: null,
    responseTime: null,
    success: null,
  }
}

export function addResponseToLogEntry (entry, response, time) {
  entry.response = cloneDeep(response)
  entry.responseTime = time
  entry.success = !response.error
}

export const EXPECTED_HISTORIES = {
  case1: [
    {
      [ORIGINS.a]: {
        [PERM_NAMES.eth_accounts]: {
          lastApproved: 1,
          accounts: {
            [ACCOUNT_ARRAYS.a[0]]: 1,
            [ACCOUNT_ARRAYS.a[1]]: 1,
          },
        },
      },
    },
    {
      [ORIGINS.a]: {
        [PERM_NAMES.eth_accounts]: {
          lastApproved: 2,
          accounts: {
            [ACCOUNT_ARRAYS.a[0]]: 2,
            [ACCOUNT_ARRAYS.a[1]]: 1,
          },
        },
      },
    },
  ],
  case2: [
    {
      [ORIGINS.a]: {
        [PERM_NAMES.eth_accounts]: {
          lastApproved: 1,
          accounts: {},
        },
      },
    },
  ],
  case3: [
    {
      [ORIGINS.a]: {
        [PERM_NAMES.test_method]: { lastApproved: 1 },
      },
      [ORIGINS.b]: {
        [PERM_NAMES.eth_accounts]: {
          lastApproved: 1,
          accounts: {
            [ACCOUNT_ARRAYS.b[0]]: 1,
          },
        },
      },
      [ORIGINS.c]: {
        [PERM_NAMES.test_method]: { lastApproved: 1 },
        [PERM_NAMES.eth_accounts]: {
          lastApproved: 1,
          accounts: {
            [ACCOUNT_ARRAYS.c[0]]: 1,
          },
        },
      },
    },
    {
      [ORIGINS.a]: {
        [PERM_NAMES.test_method]: { lastApproved: 2 },
      },
      [ORIGINS.b]: {
        [PERM_NAMES.eth_accounts]: {
          lastApproved: 1,
          accounts: {
            [ACCOUNT_ARRAYS.b[0]]: 1,
          },
        },
      },
      [ORIGINS.c]: {
        [PERM_NAMES.test_method]: { lastApproved: 1 },
        [PERM_NAMES.eth_accounts]: {
          lastApproved: 2,
          accounts: {
            [ACCOUNT_ARRAYS.c[0]]: 1,
            [ACCOUNT_ARRAYS.b[0]]: 2,
          },
        },
      },
    },
  ],
}
