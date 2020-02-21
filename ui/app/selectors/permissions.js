import {
  createSelectorCreator,
  defaultMemoize,
} from 'reselect'
import { isEqual } from 'lodash'
import {
  CAVEAT_NAMES,
} from '../../../app/scripts/controllers/permissions/enums'

// selector creators

const createDomainAccountsSelector = createSelectorCreator(
  defaultMemoize,
  domainEqualByAccounts,
)

const createAllDomainAccountsSelector = createSelectorCreator(
  defaultMemoize,
  allDomainsEqualByAccounts,
)

const createAccountPermissionSelector = createSelectorCreator(
  defaultMemoize,
  accountPermissionEqual,
)

// selectors

const accountsPermissionSelector = createDomainAccountsSelector(
  domainSelector,
  (domain = {}) => getAccountsPermissionFromDomain(domain)
)

/**
 * Selects the permitted accounts from the eth_accounts permission given state
 * and an origin.
 * @param {Object} state - The current state.
 * @param {string} origin - The origin/domain to get the permitted accounts for.
 * @returns {Array<string>} An empty array or an array of accounts.
 */
export const getPermittedAccounts = createAccountPermissionSelector(
  accountsPermissionSelector,
  (accountsPermission = {}) => getAccountsFromPermission(accountsPermission),
)

/**
 * Returns a map of permitted accounts by origin for all origins.
 * @param {Object} state - The current state.
 * @returns {Object} Permitted accounts by origin.
 */
export const getPermittedAccountsMap = createAllDomainAccountsSelector(
  allDomainsSelector,
  (domains = {}) => {
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
)

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

function getAccountsCaveatFromPermission (accountsPermission) {
  return (
    Array.isArray(accountsPermission.caveats) &&
    accountsPermission.caveats.find(
      (c) => c.name === CAVEAT_NAMES.exposedAccounts
    )
  )
}

function allDomainsSelector (state) {
  return state.metamask.domains
}

function domainSelector (state, origin) {
  return origin && state.metamask.domains && state.metamask.domains[origin]
}

// selector creator helpers

function accountPermissionEqual (a, b) {

  const aAccounts = getAccountsFromPermission(a)
  const bAccounts = getAccountsFromPermission(b)

  return isEqual(aAccounts, bAccounts)
}

function domainEqualByAccounts (a, b) {

  const aPerm = getAccountsPermissionFromDomain(a)
  const bPerm = getAccountsPermissionFromDomain(b)

  return accountPermissionEqual(aPerm, bPerm)
}

function allDomainsEqualByAccounts (a, b) {

  const aDomains = Object.keys(a).sort()
  const bDomains = Object.keys(b).sort()

  if (!isEqual(aDomains, bDomains)) {
    return false
  }

  aDomains.forEach((domain) => {
    if(!domainEqualByAccounts(a[domain], b[domain])) {
      return false
    }
  })
  return true
}
