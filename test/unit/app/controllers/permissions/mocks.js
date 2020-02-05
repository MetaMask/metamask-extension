
import { ethErrors, ERROR_CODES } from 'eth-json-rpc-errors'

import {
  // SAFE_METHODS,
  // WALLET_PREFIX,
  // METADATA_STORE_KEY,
  // LOG_STORE_KEY,
  // HISTORY_STORE_KEY,
  CAVEAT_NAMES,
  NOTIFICATION_NAMES,
} from '../../../../../app/scripts/controllers/permissions/enums'

export const noop = () => {}

export const keyringAccounts = [
  '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
]

export const DUMMY_ACCOUNT = '0xabc'

export const getKeyringAccounts = async () => keyringAccounts

export const getNotifyDomain = (notifications = {}) => (origin, notification) => {
  notifications[origin].push(notification)
}

export const getNotifyAllDomains = (notifications = {}) => (notification) => {
  Object.keys(notifications).forEach(origin => {
    notifications[origin].push(notification)
  })
}

export const getApprovedPermissionsRequest = (id, permissions = {}) => {
  return {
    permissions,
    metadata: { id },
  }
}

export const platform = {
  openExtensionInBrowser: noop,
}

export const REQUEST_IDS = {
  a: '1',
  b: '2',
  c: '3',
}

export const ORIGINS = {
  metamask: 'MetaMask',
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

export const PERMS = {

  names: {
    eth_accounts: 'eth_accounts',
  },

  request: {
    eth_accounts: () => {
      return { eth_accounts: {} }
    },
    testMethod: () => {
      return { test_method: {} }
    },
  },

  complete: {
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
}

export const rpcRequests = {
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

  requestPermission: (origin, permission) => {
    return {
      origin,
      method: 'wallet_requestPermissions',
      params: [ PERMS.request[permission]() ],
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

export function getRestrictedMethods (permissionsController) {
  return {

    'eth_accounts': {
      description: `View the addresses of the user's selected accounts.`,
      method: (_, res, __, end) => {
        permissionsController.getKeyringAccounts()
          .then((accounts) => {
            res.result = accounts
            end()
          })
          .catch(
            /* istanbul ignore next */
            (err) => {
              res.error = err
              end(err)
            }
          )
      },
    },

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
