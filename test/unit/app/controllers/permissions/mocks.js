
import { ERROR_CODES } from 'eth-json-rpc-errors'

import {
  // SAFE_METHODS,
  // WALLET_PREFIX,
  // METADATA_STORE_KEY,
  // LOG_STORE_KEY,
  // HISTORY_STORE_KEY,
  CAVEAT_NAMES,
  NOTIFICATION_NAMES,
} from '../../../../../app/scripts/controllers/permissions/enums'

import mockState from '../../../../data/mock-state.json'

export const noop = () => {}

export const keyringAccounts = Object.keys(mockState.metamask.accounts)

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

export const platform = {
  openExtensionInBrowser: noop,
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

export const PERMS = {
  names: {
    ethAccounts: 'eth_accounts',
  },
  get: {
    ethAccounts: (accounts) => {
      return {
        eth_accounts: {
          caveats: [{
            type: 'filterResponse',
            value: accounts,
            name: CAVEAT_NAMES.exposedAccounts,
          }],
        } }
    },
  },
  request: {
    ethAccounts: {
      eth_accounts: {},
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
    forbiddenUsage: () => {
      return {
        name: 'Error',
        message: 'May not call legacyExposeAccounts on origin with exposed accounts.',
      }
    }
  },
  handleNewAccountSelected: {
    invalidParams: () => {
      return {
        name: 'Error',
        message: 'Should provide non-empty origin and account strings.',
      }
    },
  }
}
