import {
  CAVEAT_NAMES,
} from '../../../app/scripts/controllers/permissions/enums'

// selectors

/**
 * Selects the permitted accounts from the eth_accounts permission given state
 * and an origin.
 * @param {Object} state - The current state.
 * @param {string} origin - The origin/domain to get the permitted accounts for.
 * @returns {Array<string>} An empty array or an array of accounts.
 */
export function getPermittedAccounts (state, origin) {
  return getAccountsFromPermission(
    getAccountsPermissionFromDomain(
      domainSelector(state, origin)
    )
  )
}

/**
 * Returns a map of permitted accounts by origin for all origins.
 * @param {Object} state - The current state.
 * @returns {Object} Permitted accounts by origin.
 */
export function getPermittedAccountsByOrigin (state) {
  const domains = allDomainsSelector(state)
  return Object.keys(domains).reduce((acc, domainKey) => {
    const accounts = getAccountsFromPermission(
      getAccountsPermissionFromDomain(domains[domainKey])
    )
    if (accounts.length > 0) {
      acc[domainKey] = accounts
    }
    return acc
  }, {})
}

// selector helpers

function getAccountsPermissionFromDomain (domain = {}) {
  return (
    Array.isArray(domain.permissions)
      ? domain.permissions.find(
        (perm) => perm.parentCapability === 'eth_accounts'
      )
      : {}
  )
}

function getAccountsFromPermission (accountsPermission) {
  const accountsCaveat = getAccountsCaveatFromPermission(accountsPermission)
  return (
    accountsCaveat && Array.isArray(accountsCaveat.value)
      ? accountsCaveat.value
      : []
  )
}

function getAccountsCaveatFromPermission (accountsPermission = {}) {
  return (
    Array.isArray(accountsPermission.caveats) &&
    accountsPermission.caveats.find(
      (c) => c.name === CAVEAT_NAMES.exposedAccounts
    )
  )
}

function allDomainsSelector (state) {
  return state.metamask.domains || {}
}

function domainSelector (state, origin) {
  return origin && state.metamask.domains && state.metamask.domains[origin]
}
