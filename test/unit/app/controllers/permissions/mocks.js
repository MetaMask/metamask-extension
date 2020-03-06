import { ethErrors, ERROR_CODES } from 'eth-json-rpc-errors'
import deepFreeze from 'deep-freeze-strict'

import _getRestrictedMethods
  from '../../../../../app/scripts/controllers/permissions/restrictedMethods'

import {
  CAVEAT_NAMES,
  NOTIFICATION_NAMES,
} from '../../../../../app/scripts/controllers/permissions/enums'

export const noop = () => {}

/**
 * Mock Permissions Controller and Middleware
 */

const platform = {
  openExtensionInBrowser: noop,
}

const keyringAccounts = deepFreeze([
  '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
])

const getKeyringAccounts = async () => [ ...keyringAccounts ]

// perm controller initialization helper
const getRestrictedMethods = (permController) => {
  return {

    // the actual, production restricted methods
    ..._getRestrictedMethods(permController),

    // our own dummy method for testing
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

/**
 * @returns {Object} A PermissionsController constructor options object.
 */
export function getPermControllerOpts () {
  return {
    platform,
    getKeyringAccounts,
    notifyDomain: noop,
    notifyAllDomains: noop,
    getRestrictedMethods,
  }
}

/**
 * @returns {Function} A Promise-wrapped middleware function with convenient default args.
 */
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

/**
 * @param {Object} notifications - An object that will store notifications produced
 * by the permissions controller.
 * @returns {Function} A function passed to the permissions controller at initialization,
 * for recording notifications.
 */
export const getNotifyDomain = (notifications = {}) => (origin, notification) => {
  notifications[origin].push(notification)
}

/**
 * @param {Object} notifications - An object that will store notifications produced
 * by the permissions controller.
 * @returns {Function} A function passed to the permissions controller at initialization,
 * for recording notifications.
 */
export const getNotifyAllDomains = (notifications = {}) => (notification) => {
  Object.keys(notifications).forEach((origin) => {
    notifications[origin].push(notification)
  })
}

/**
 * Constants and Mock Objects
 * - e.g. permissions, caveats, and permission requests
 */

const ORIGINS = {
  a: 'foo.xyz',
  b: 'bar.abc',
  c: 'baz.def',
}

const PERM_NAMES = {
  eth_accounts: 'eth_accounts',
  test_method: 'test_method',
}

const ACCOUNT_ARRAYS = {
  metamask: [],
  a: [ ...keyringAccounts ],
  b: [keyringAccounts[0]],
  c: [keyringAccounts[1]],
}

const CAVEATS = {
  eth_accounts: (accounts) => {
    return {
      type: 'filterResponse',
      value: accounts,
      name: CAVEAT_NAMES.exposedAccounts,
    }
  },
}

const PERMS = {
  approvedRequest: (id, permissions = {}) => {
    return {
      permissions: { ...permissions },
      metadata: { id },
    }
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

/**
 * Objects with function values for getting correctly formatted permissions,
 * caveats, errors, permissions requests etc.
 */
export const getters = deepFreeze({

  CAVEATS,

  PERMS,

  ERRORS: {

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

    pendingApprovals: {
      duplicateOriginOrId: (id, origin) => {
        return {
          message: `Pending approval with id ${id} or origin ${origin} already exists.`,
        }
      },
      requestAlreadyPending: () => {
        return {
          message: 'Permissions request already pending; please wait.',
        }
      },
    },
  },

  NOTIFICATIONS: {

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
  },

  RPC_REQUESTS: {
    custom: (origin, method, params = [], id) => {
      const req = {
        origin,
        method,
        params,
      }
      if (id !== undefined) {
        req.id = id
      }
      return req
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
  },
})

/**
 * Objects with immutable mock values.
 */
export const constants = deepFreeze({

  DUMMY_ACCOUNT: '0xabc',

  REQUEST_IDS: {
    a: '1',
    b: '2',
    c: '3',
  },

  ORIGINS: { ...ORIGINS },

  ACCOUNT_ARRAYS: { ...ACCOUNT_ARRAYS },

  PERM_NAMES: { ...PERM_NAMES },

  RESTRICTED_METHODS: [
    'eth_accounts',
    'test_method',
  ],

  EXPECTED_HISTORIES: {

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

    case4: [
      {
        [ORIGINS.a]: {
          [PERM_NAMES.test_method]: {
            lastApproved: 1,
          },
        },
      },
    ],
  },
})
