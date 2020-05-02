import { forOwn } from 'lodash'
import { getOriginOfCurrentTab } from './selectors'
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
  const domains = getPermissionDomains(state)
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

export function getConnectedDomainsForSelectedAddress (state) {
  const {
    selectedAddress,
  } = state.metamask
  const domains = getPermissionDomains(state)
  const domainMetadata = getPermissionDomainsMetadata(state)

  const connectedDomains = []

  forOwn(domains, (domainValue, domainKey) => {
    const exposedAccounts = getAccountsFromDomain(domainValue)
    if (!exposedAccounts.includes(selectedAddress)) {
      return
    }

    const {
      extensionId,
      name,
      icon,
    } = domainMetadata[domainKey] || {}

    connectedDomains.push({
      extensionId,
      key: domainKey,
      name,
      icon,
    })
  })

  return connectedDomains
}

export function getPermittedAccountsForCurrentTab (state) {
  const permittedAccountsMap = getPermittedAccountsByOrigin(state)
  const originOfCurrentTab = getOriginOfCurrentTab(state)
  return permittedAccountsMap[originOfCurrentTab] || []
}

export function getAddressConnectedDomainMap (state) {
  const domainMetadata = getPermissionDomainsMetadata(state)

  const accountsMap = getPermittedAccountsByOrigin(state)
  const addressConnectedIconMap = {}

  Object.keys(accountsMap).forEach((domainKey) => {

    const { icon, name } = domainMetadata[domainKey] || {}

    accountsMap[domainKey].forEach((address) => {

      const nameToRender = name || domainKey

      addressConnectedIconMap[address] = addressConnectedIconMap[address]
        ? { ...addressConnectedIconMap[address], [domainKey]: { icon, name: nameToRender } }
        : { [domainKey]: { icon, name: nameToRender } }
    })
  })

  return addressConnectedIconMap
}

// selector helpers

function getAccountsFromDomain (domain) {
  return getAccountsFromPermission(
    getAccountsPermissionFromDomain(domain)
  )
}

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

export function getPermissionDomains (state) {
  return state.metamask.domains || {}
}

export function getPermissionDomainsMetadata (state) {
  return state.metamask.domainMetadata || {}
}

function domainSelector (state, origin) {
  return origin && state.metamask?.domains[origin]
}
